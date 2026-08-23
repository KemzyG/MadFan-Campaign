<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Presence heartbeat. Stamps last_seen_at on the authenticated user, throttled to
 * once per 60s per user so the ~4s chat polls don't storm the database. Writes via
 * the query builder to leave updated_at (and model events) untouched.
 */
class TouchLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        try {
            $user = $request->user();

            if ($user !== null && Cache::add("presence:seen:{$user->getKey()}", 1, 60)) {
                DB::table('users')->where('id', $user->getKey())->update(['last_seen_at' => now()]);
            }
        } catch (\Throwable) {
            // Presence is best-effort: a cache/DB hiccup must never break the page.
        }

        return $response;
    }
}
