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

        // Onboarding is single-step now: picking a fandom is the whole
        // requirement (see SocialOnboardingController::storeFandom, which
        // sets social_onboarded_at itself). Club is no longer part of this
        // gate — see the "Choose your club" removal.
        if ($user->favourite_fandom_id === null || $user->social_onboarded_at === null) {
            return redirect()->route('social.onboarding.fandom');
        }

        return $next($request);
    }
}
