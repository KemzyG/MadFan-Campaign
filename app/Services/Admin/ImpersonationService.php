<?php

namespace App\Services\Admin;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ImpersonationService
{
    public const SESSION_KEY = 'impersonator_id';

    public const VIEW_AS_USER_KEY = 'view_as_user_id';

    public function isImpersonating(?Request $request = null): bool
    {
        $request ??= request();

        return filled($request->session()->get(self::SESSION_KEY))
            || filled($request->session()->get(self::VIEW_AS_USER_KEY));
    }

    public function isHardImpersonating(?Request $request = null): bool
    {
        return filled(($request ?? request())->session()->get(self::SESSION_KEY));
    }

    public function isSoftViewingAs(?Request $request = null): bool
    {
        return filled(($request ?? request())->session()->get(self::VIEW_AS_USER_KEY));
    }

    public function impersonatorId(?Request $request = null): ?int
    {
        $id = ($request ?? request())->session()->get(self::SESSION_KEY);

        return $id !== null ? (int) $id : null;
    }

    public function viewAsUserId(?Request $request = null): ?int
    {
        $id = ($request ?? request())->session()->get(self::VIEW_AS_USER_KEY);

        return $id !== null ? (int) $id : null;
    }

    public function canImpersonate(User $actor, User $target): bool
    {
        if (! $actor->hasRole('super-admin')) {
            return false;
        }

        if ($this->isImpersonating()) {
            return false;
        }

        if ($actor->is($target)) {
            return false;
        }

        if ($target->hasRole('super-admin')) {
            return false;
        }

        return $target->is_staff || $target->isInertiaAdmin();
    }

    /**
     * Shared Inertia props for the impersonation banner.
     *
     * @return array{active: bool, mode: string, impersonator: ?array{id: int, name: string, email: string}, as: ?array{id: int, name: string, email: string, is_staff: bool, staff_position: ?string}}|null
     */
    public function sharedProps(?User $currentUser, ?Request $request = null): ?array
    {
        $request ??= request();

        if ($this->isHardImpersonating($request)) {
            return $this->hardSharedProps($currentUser, $request);
        }

        if ($this->isSoftViewingAs($request) && $currentUser) {
            return $this->softSharedProps($currentUser, $request);
        }

        return null;
    }

    public function start(User $actor, User $target, Request $request): User
    {
        if (! $this->canImpersonate($actor, $target)) {
            throw ValidationException::withMessages([
                'user' => 'You cannot view the app as this account.',
            ]);
        }

        // Anyone who can open /app: full login swap and stay in admin.
        if ($target->canAccessInertiaAdmin()) {
            $request->session()->forget(self::VIEW_AS_USER_KEY);
            $request->session()->put(self::SESSION_KEY, $actor->id);

            Auth::login($target);
            $request->session()->regenerate();

            $this->logStarted($actor, $target, 'hard');

            return $target;
        }

        // Fallback soft preview (e.g. inactive staff without console access).
        $request->session()->forget(self::SESSION_KEY);
        $request->session()->put(self::VIEW_AS_USER_KEY, $target->id);

        $this->logStarted($actor, $target, 'soft');

        return $target;
    }

    public function stop(Request $request): User
    {
        if ($this->isHardImpersonating($request)) {
            return $this->stopHard($request);
        }

        if ($this->isSoftViewingAs($request)) {
            return $this->stopSoft($request);
        }

        throw ValidationException::withMessages([
            'impersonation' => 'You are not currently viewing as another user.',
        ]);
    }

    public function redirectUrlFor(User $target): string
    {
        if ($target->canAccessInertiaAdmin()) {
            return route('admin.dashboard');
        }

        if ($target->is_staff) {
            return route('admin.staff.show', $target);
        }

        return route('admin.users.show', $target);
    }

    /**
     * @return array{active: bool, mode: string, impersonator: array{id: int, name: string, email: string}, as: array{id: int, name: string, email: string, is_staff: bool, staff_position: ?string}}|null
     */
    private function hardSharedProps(?User $currentUser, Request $request): ?array
    {
        $impersonatorId = $this->impersonatorId($request);

        if ($impersonatorId === null || ! $currentUser) {
            return null;
        }

        $impersonator = User::query()->find($impersonatorId);

        if (! $impersonator) {
            $request->session()->forget(self::SESSION_KEY);

            return null;
        }

        return [
            'active' => true,
            'mode' => 'hard',
            'impersonator' => [
                'id' => $impersonator->id,
                'name' => $impersonator->name,
                'email' => $impersonator->email,
            ],
            'as' => [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
                'email' => $currentUser->email,
                'is_staff' => (bool) $currentUser->is_staff,
                'staff_position' => $currentUser->staff_position,
            ],
        ];
    }

    /**
     * @return array{active: bool, mode: string, impersonator: array{id: int, name: string, email: string}, as: array{id: int, name: string, email: string, is_staff: bool, staff_position: ?string}}|null
     */
    private function softSharedProps(User $currentUser, Request $request): ?array
    {
        $viewAsId = $this->viewAsUserId($request);

        if ($viewAsId === null) {
            return null;
        }

        $asUser = User::query()->find($viewAsId);

        if (! $asUser) {
            $request->session()->forget(self::VIEW_AS_USER_KEY);

            return null;
        }

        return [
            'active' => true,
            'mode' => 'soft',
            'impersonator' => [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
                'email' => $currentUser->email,
            ],
            'as' => [
                'id' => $asUser->id,
                'name' => $asUser->name,
                'email' => $asUser->email,
                'is_staff' => (bool) $asUser->is_staff,
                'staff_position' => $asUser->staff_position,
            ],
        ];
    }

    private function stopHard(Request $request): User
    {
        $impersonatorId = $this->impersonatorId($request);
        $impersonator = $impersonatorId ? User::query()->find($impersonatorId) : null;

        if (! $impersonator || ! $impersonator->hasRole('super-admin')) {
            $request->session()->forget(self::SESSION_KEY);

            throw ValidationException::withMessages([
                'impersonation' => 'Unable to restore your super-admin session.',
            ]);
        }

        $asUser = $request->user();

        Auth::login($impersonator);
        $request->session()->forget([self::SESSION_KEY, self::VIEW_AS_USER_KEY]);
        $request->session()->regenerate();

        $this->logStopped($impersonator, $asUser);

        return $impersonator;
    }

    private function stopSoft(Request $request): User
    {
        $actor = $request->user();

        if (! $actor instanceof User || ! $actor->hasRole('super-admin')) {
            $request->session()->forget(self::VIEW_AS_USER_KEY);

            throw ValidationException::withMessages([
                'impersonation' => 'Unable to exit view as.',
            ]);
        }

        $asUser = User::query()->find($this->viewAsUserId($request));
        $request->session()->forget(self::VIEW_AS_USER_KEY);

        $this->logStopped($actor, $asUser);

        return $actor;
    }

    private function logStarted(User $actor, User $target, string $mode): void
    {
        ActivityLog::record(
            'impersonation.started',
            "Super-admin {$actor->email} started viewing as {$target->email}",
            $actor->id,
            [
                'mode' => $mode,
                'impersonator_id' => $actor->id,
                'target_user_id' => $target->id,
                'target_is_staff' => (bool) $target->is_staff,
                'target_staff_position' => $target->staff_position,
            ],
        );
    }

    private function logStopped(User $impersonator, ?User $asUser): void
    {
        ActivityLog::record(
            'impersonation.stopped',
            "Super-admin {$impersonator->email} stopped viewing as ".($asUser?->email ?? 'unknown'),
            $impersonator->id,
            [
                'impersonator_id' => $impersonator->id,
                'target_user_id' => $asUser?->id,
            ],
        );
    }
}
