<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminMfaPassed
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || (! $user->canAccessInertiaAdmin() && ! $user->hasRole('super-admin'))) {
            return $next($request);
        }

        if (! config('services.admin_mfa.required', true)) {
            $request->session()->put('admin_mfa_passed', true);

            return $next($request);
        }

        if ($request->routeIs(
            'admin.mfa.setup',
            'admin.mfa.setup.store',
            'admin.mfa.challenge',
            'admin.mfa.challenge.store',
            'admin.logout',
            'logout',
        )) {
            return $next($request);
        }

        if (! $user->hasMfaEnabled()) {
            return redirect()->route('admin.mfa.setup');
        }

        if ($request->session()->get('admin_mfa_passed') === true) {
            return $next($request);
        }

        return redirect()->route('admin.mfa.challenge');
    }
}
