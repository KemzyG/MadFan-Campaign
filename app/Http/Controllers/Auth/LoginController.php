<?php

namespace App\Http\Controllers\Auth;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Staff\StaffAssignmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\PermissionRegistrar;

class LoginController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->canAccessInertiaAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Auth/Login');
    }

    public function store(Request $request, StaffAssignmentService $staffAssignments): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']], $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        $request->session()->regenerate();

        $user = $request->user();

        if ($user instanceof User) {
            $this->ensureStaffConsolePermissions($user, $staffAssignments);
            Auth::setUser($user->fresh());
            $user = $request->user();
        }

        if (! $user?->canAccessInertiaAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        $request->session()->forget('admin_mfa_passed');

        if (! config('services.admin_mfa.required', true)) {
            $request->session()->put('admin_mfa_passed', true);

            return redirect()->intended(route('admin.dashboard'));
        }

        if ($user instanceof User && $user->hasMfaEnabled()) {
            return redirect()->route('admin.mfa.challenge');
        }

        if ($user instanceof User && ! $user->hasMfaEnabled()) {
            return redirect()->route('admin.mfa.setup');
        }

        $request->session()->put('admin_mfa_passed', true);

        return redirect()->intended(route('admin.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user instanceof User) {
            $user->incrementTokenVersion();
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }

    /**
     * Keep active staff console permissions in sync with their staff position pack.
     */
    private function ensureStaffConsolePermissions(User $user, StaffAssignmentService $staffAssignments): void
    {
        if ($user->hasAnyRole(User::ADMIN_ROLES) || ! $user->isActiveStaffMember()) {
            return;
        }

        $position = StaffPosition::tryFrom((string) $user->staff_position);

        if ($position === null) {
            return;
        }

        $staffAssignments->syncConsolePermissions($user, $position, StaffStatus::Active);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
