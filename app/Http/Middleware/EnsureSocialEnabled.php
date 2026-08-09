<?php

namespace App\Http\Middleware;

use App\Support\ApplicationSettings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSocialEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! ApplicationSettings::socialNetworkEnabled()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Mad Fan Social is not enabled yet.'], 403);
            }

            return redirect()
                ->route('fan.campaign')
                ->with('error', 'Mad Fan Social is not enabled yet.');
        }

        return $next($request);
    }
}
