<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->hasRole('super-admin')) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Super-admin access required.'], 403);
            }

            abort(403, 'Super-admin access required.');
        }

        return $next($request);
    }
}
