<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\SocialAccountService;
use App\Support\ApplicationSettings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRequiredSocialAccountsConnected
{
    public function __construct(
        protected SocialAccountService $socialAccounts,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $next($request);
        }

        if ($user->hasAnyRole(User::ADMIN_ROLES)) {
            return $next($request);
        }

        if (! ApplicationSettings::socialVerificationRequired()) {
            return $next($request);
        }

        if ($request->routeIs(
            'fan.connect-accounts',
            'fan.social.*',
            'logout',
            'impersonation.leave',
        )) {
            return $next($request);
        }

        if ($this->socialAccounts->hasRequiredConnections($user)) {
            return $next($request);
        }

        if (! $request->session()->has('url.intended')) {
            $request->session()->put('url.intended', $request->fullUrl());
        }

        return redirect()
            ->route('fan.connect-accounts', ['onboarding' => 1])
            ->with('onboarding_required', true);
    }
}
