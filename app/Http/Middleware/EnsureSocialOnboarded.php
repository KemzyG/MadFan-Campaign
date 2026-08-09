<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSocialOnboarded
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $next($request);
        }

        if ($user->social_onboarded_at === null || $user->favourite_club_id === null) {
            return redirect()->route('social.onboarding.club');
        }

        return $next($request);
    }
}
