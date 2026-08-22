<?php

use App\Http\Middleware\EnsureActiveStaffMember;
use App\Http\Middleware\EnsureAdminMfaPassed;
use App\Http\Middleware\EnsureAdminOrganizationContext;
use App\Http\Middleware\EnsureAdminRole;
use App\Http\Middleware\EnsureApplicationNotInMaintenance;
use App\Http\Middleware\EnsureEmailIsVerifiedWhenEnabled;
use App\Http\Middleware\EnsureRequiredSocialAccountsConnected;
use App\Http\Middleware\EnsureSocialEnabled;
use App\Http\Middleware\EnsureSocialOnboarded;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PasetoAuthenticate;
use App\Http\Middleware\PreventFanRoutesOnAdminDomain;
use App\Http\Middleware\RedirectApexToCampaign;
use App\Http\Middleware\SecurityHeaders;
use App\Support\AdminRouting;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // cPanel / reverse-proxy SSL termination (X-Forwarded-Proto, etc.)
        $middleware->trustProxies(at: '*');

        // Runs before route `auth` so guest redirects cannot steal /dashboard on ADMIN_DOMAIN.
        $middleware->prepend(PreventFanRoutesOnAdminDomain::class);

        // Apex/www never carry campaign routes once CAMPAIGN_DOMAIN is domain-scoped; bounce first.
        $middleware->prepend(RedirectApexToCampaign::class);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            SecurityHeaders::class,
        ]);

        $middleware->redirectGuestsTo(function (Request $request): string {
            if (AdminRouting::isInertiaAdminRequest($request)) {
                return route('admin.login');
            }

            return route('login');
        });

        $middleware->alias([
            'auth.paseto' => PasetoAuthenticate::class,
            'admin.role' => EnsureAdminRole::class,
            'admin.org' => EnsureAdminOrganizationContext::class,
            'super-admin' => EnsureSuperAdmin::class,
            'social.required' => EnsureRequiredSocialAccountsConnected::class,
            'staff.required' => EnsureActiveStaffMember::class,
            'app.maintenance' => EnsureApplicationNotInMaintenance::class,
            'admin.mfa' => EnsureAdminMfaPassed::class,
            'verified' => EnsureEmailIsVerifiedWhenEnabled::class,
            'social.enabled' => EnsureSocialEnabled::class,
            'social.onboarded' => EnsureSocialOnboarded::class,
        ]);

        $middleware->encryptCookies(except: [
            (string) env('REGISTRATION_LOCK_COOKIE', 'mf_reg_lock'),
        ]);

        // WebRTC SDP must keep trailing CRLF; TrimStrings would strip it and break setRemoteDescription.
        $middleware->trimStrings(except: [
            'payload.sdp',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            function (Request $request): bool {
                if ($request->expectsJson() || $request->wantsJson()) {
                    return true;
                }

                $appPath = AdminRouting::appPath();

                return $request->is('api/*', $appPath.'/api', $appPath.'/api/*');
            },
        );
    })->create();
