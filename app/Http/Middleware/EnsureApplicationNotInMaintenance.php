<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\ApplicationSettings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApplicationNotInMaintenance
{
    /**
     * Restrict fan-facing routes during maintenance. Admin areas and admin users are never blocked.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! ApplicationSettings::maintenanceMode()) {
            return $next($request);
        }

        if ($this->targetsAdminArea($request)) {
            return $next($request);
        }

        $user = $request->user();

        if ($user instanceof User && $user->canAccessInertiaAdmin()) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Mad Fan is temporarily under maintenance. Please check back soon.',
            ], 503);
        }

        return redirect()
            ->route('fan.campaign')
            ->with('error', 'Mad Fan is temporarily under maintenance. Please check back soon.');
    }

    private function targetsAdminArea(Request $request): bool
    {
        return $request->is('admin', 'admin/*', 'app', 'app/*');
    }
}
