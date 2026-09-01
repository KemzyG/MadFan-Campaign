<?php

namespace App\Http\Middleware;

use App\Support\AdminRouting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * On ADMIN_DOMAIN, only the Inertia admin console (+ Filament) should run.
 * Fan routes still match the host unless redirected, which would load Fan pages
 * through admin.blade.php (wrong Vite CSS/JS).
 */
class PreventFanRoutesOnAdminDomain
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! AdminRouting::isOnAppDomain($request)) {
            return $next($request);
        }

        // Filament depends on Livewire script/update endpoints on the admin host.
        if (AdminRouting::isLivewirePath($request)) {
            return $next($request);
        }

        // Public disk logos/avatars (fallback route or static files on this host).
        if ($request->is('storage', 'storage/*')) {
            return $next($request);
        }

        $filamentPath = AdminRouting::filamentPath();

        if ($request->is($filamentPath, $filamentPath.'/*')) {
            return $next($request);
        }

        $appPath = AdminRouting::appPath();

        // Legacy prefixed URLs when the console is mounted at the subdomain root.
        if ($appPath === '') {
            foreach (['app', 'ops'] as $legacyPrefix) {
                if ($request->is($legacyPrefix, $legacyPrefix.'/*')) {
                    $remainder = ltrim(substr($request->getRequestUri(), strlen('/'.$legacyPrefix)), '/');
                    $target = $remainder === '' ? '/' : '/'.$remainder;

                    return redirect()->to($target);
                }
            }
        }

        // Legacy /app URLs when the console uses the /ops prefix on this host.
        if ($appPath === 'ops' && $request->is('app', 'app/*')) {
            $remainder = ltrim(substr($request->getRequestUri(), strlen('/app')), '/');
            $target = $remainder === '' ? '/ops' : '/ops/'.$remainder;

            return redirect()->to($target);
        }

        if ($appPath !== '') {
            if (AdminRouting::isAdminAppPath($request)) {
                return $next($request);
            }

            if ($request->is('/', 'dashboard')) {
                return redirect()->to(AdminRouting::absoluteAppPath());
            }

            return redirect()->away(AdminRouting::fanSiteUrl($request->getRequestUri()));
        }

        // Root-mounted admin console on this host.
        if (AdminRouting::isFanOnlyPath($request)) {
            return redirect()->away(AdminRouting::fanSiteUrl($request->getRequestUri()));
        }

        if ($request->is('dashboard')) {
            return redirect()->to(AdminRouting::absoluteAppPath());
        }

        return $next($request);
    }
}
