<?php

namespace App\Http\Middleware;

use App\Models\SocialNotification;
use App\Models\User;
use App\Services\Admin\AdminOrganizationContext;
use App\Services\Admin\ImpersonationService;
use App\Services\Fan\FanPageDataService;
use App\Services\Social\ChatService;
use App\Services\SocialAccountService;
use App\Services\Staff\StaffAssignmentService;
use App\Support\AdminRouting;
use App\Support\AdminWorkspace;
use App\Support\ApplicationSettings;
use App\Support\CampaignRouting;
use App\Support\PublicStorageUrl;
use App\Support\SocialRouting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function rootView(Request $request): string
    {
        if (AdminRouting::isInertiaAdminRequest($request)) {
            return 'admin';
        }

        if (SocialRouting::isSocialRequest($request) || $this->usesSocialAuthShell($request)) {
            return 'social';
        }

        return 'user';
    }

    /**
     * Fan auth + connect-accounts onboarding pages use the dark, mf-* Social
     * visual shell (see resources/js/social.jsx, which already loads these
     * pages so an in-SPA session-expiry redirect from /social can render
     * them without a bundle switch).
     */
    private function usesSocialAuthShell(Request $request): bool
    {
        return in_array($request->route()?->getName(), [
            'login',
            'register',
            'password.request',
            'password.email',
            'password.reset',
            'password.store',
            'verification.notice',
            'fan.connect-accounts',
        ], true);
    }

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $onAdminSurface = AdminRouting::isAdminSurface($request);

        $socialStatus = null;
        if ($user && ! $onAdminSurface) {
            $socialStatus = [
                'required_complete' => app(SocialAccountService::class)->hasRequiredConnections($user),
                'accounts' => app(SocialAccountService::class)->statusForUser($user),
            ];
        }

        return [
            ...parent::share($request),
            'app' => [
                'name' => config('app.name'),
                'admin_path' => AdminRouting::appPathPrefix(),
                'logo_url' => is_file(public_path('favicon.jpg'))
                    ? asset('favicon.jpg')
                    : null,
                'default_image_url' => PublicStorageUrl::defaultImageUrl(),
                'campaign' => CampaignRouting::frontendConfig(),
                'social_domain' => SocialRouting::frontendConfig(),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'fan_id' => $user->fan_id,
                    'handle' => $user->handle,
                    'avatar_url' => $user->avatar_url,
                    'total_points' => $user->total_points,
                    'current_streak_days' => $user->current_streak_days,
                    'roles' => $user->getRoleNames()->values()->all(),
                    'is_staff' => (bool) $user->is_staff,
                    'staff_position' => $user->staff_position,
                    'staff_status' => $user->staff_status,
                    'staff_active' => app(StaffAssignmentService::class)->isActiveStaff($user),
                    'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
                    'email_verified' => $user->hasVerifiedEmail(),
                    'mfa_enabled' => $user->hasMfaEnabled(),
                    'favourite_club_id' => $user->favourite_club_id,
                    'favourite_fandom_id' => $user->favourite_fandom_id,
                    'social_onboarded' => $user->social_onboarded_at !== null,
                ] : null,
            ],
            'madFanSocial' => [
                'enabled' => ApplicationSettings::socialNetworkEnabled(),
            ],
            'workspace' => ($user && $onAdminSurface) ? AdminWorkspace::for($user) : null,
            'adminOrganization' => ($user && $onAdminSurface) ? $this->adminOrganizationProps($user) : null,
            'social' => $socialStatus,
            'notifications' => $user && ! $onAdminSurface ? [
                'unread_count' => fn () => SocialNotification::query()
                    ->where('recipient_id', $user->id)
                    ->unread()
                    ->count(),
            ] : null,
            'chat' => $user && ! $onAdminSurface ? [
                'unread_count' => fn () => app(ChatService::class)->unreadCount($user),
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
                'open_onboarding' => fn () => $request->session()->get('open_onboarding'),
                'onboarding_required' => fn () => $request->session()->get('onboarding_required'),
                'mfa_recovery_codes' => fn () => $request->session()->get('mfa_recovery_codes'),
            ],
            'impersonation' => app(ImpersonationService::class)->sharedProps($user, $request),
            'fanNav' => fn () => $onAdminSurface
                ? null
                : app(FanPageDataService::class)->shared($request),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function adminOrganizationProps(User $user): array
    {
        $context = app(AdminOrganizationContext::class);

        return [
            'is_super_admin' => $user->hasRole('super-admin'),
            'current' => $context->organization() ? [
                'id' => $context->organization()->id,
                'name' => $context->organization()->name,
                'slug' => $context->organization()->slug,
            ] : null,
            'available' => $context->availableOrganizations(),
            'filament_url' => $user->hasRole('super-admin') ? url('/admin') : null,
        ];
    }
}
