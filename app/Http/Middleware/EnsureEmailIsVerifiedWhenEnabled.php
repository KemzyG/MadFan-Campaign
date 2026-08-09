<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerifiedWhenEnabled
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string $redirectToRoute = null): Response
    {
        if (! config('auth.email_verification_enabled')) {
            return $next($request);
        }

        return app(EnsureEmailIsVerified::class)->handle($request, $next, $redirectToRoute);
    }
}
