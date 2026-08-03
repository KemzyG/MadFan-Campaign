<?php

namespace App\Providers;

use App\Enums\AdminPermission;
use App\Listeners\LogFailedAuthentication;
use App\Models\Role;
use App\Models\User;
use App\Policies\RolePolicy;
use App\Services\Admin\AdminOrganizationContext;
use Illuminate\Auth\Events\Failed;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AdminOrganizationContext::class);
    }

    public function boot(): void
    {
        if ($this->app->environment('production') && config('app.force_https')) {
            URL::forceScheme('https');
        }

        Password::defaults(fn () => Password::min(8)
            ->mixedCase()
            ->numbers());

        Gate::policy(Role::class, RolePolicy::class);

        // Super-admins bypass every ability check (Filament policies, Gates, Spatie permissions).
        Gate::before(function ($user, string $ability): ?bool {
            if ($user instanceof User && $user->hasRole('super-admin')) {
                return true;
            }

            return null;
        });

        Gate::define('viewDashboard', fn (User $user): bool => $user->can(AdminPermission::DashboardView->value));
        Gate::define('viewSystemLogs', fn (User $user): bool => $user->can(AdminPermission::SystemLogsView->value));
        Gate::define('clearSystemLogs', fn (User $user): bool => $user->can(AdminPermission::SystemLogsClear->value));
        Gate::define('viewActivityLogs', fn (User $user): bool => $user->can(AdminPermission::ActivityLogsView->value));
        Gate::define('viewReferrals', fn (User $user): bool => $user->can(AdminPermission::ReferralsView->value));
        Gate::define('viewPointTransactions', fn (User $user): bool => $user->can(AdminPermission::PointTransactionsView->value));
        Gate::define('manageSeasons', fn (User $user): bool => $user->can(AdminPermission::SeasonsManage->value));
        Gate::define('manageLoyaltyTiers', fn (User $user): bool => $user->can(AdminPermission::LoyaltyTiersManage->value));
        Gate::define('manageLeagues', fn (User $user): bool => $user->can(AdminPermission::LeaguesManage->value));
        Gate::define('manageClubs', fn (User $user): bool => $user->can(AdminPermission::ClubsManage->value));
        Gate::define('manageAdmins', fn (User $user): bool => $user->can(AdminPermission::AdminsManage->value));
        Gate::define('viewAdmins', fn (User $user): bool => $user->can(AdminPermission::AdminsView->value));

        RateLimiter::for('login', function ($request) {
            $email = (string) $request->input('email');

            return [
                Limit::perMinute(5)->by($request->ip()),
                Limit::perMinute(5)->by(strtolower($email).'|'.$request->ip()),
            ];
        });

        RateLimiter::for('register', fn ($request) => Limit::perMinute(10)->by($request->ip()));

        RateLimiter::for('waitlist', fn ($request) => Limit::perMinute(10)->by($request->ip()));

        RateLimiter::for('admin-mutations', fn ($request) => Limit::perMinute(30)->by(
            $request->user()?->id ?: $request->ip(),
        ));

        RateLimiter::for('passport-update', fn ($request) => Limit::perMinute(20)->by(
            $request->user()?->id ?: $request->ip(),
        ));

        Event::listen(Failed::class, LogFailedAuthentication::class);
    }
}
