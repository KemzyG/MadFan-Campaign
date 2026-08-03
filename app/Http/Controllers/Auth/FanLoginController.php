<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RegistrationIdentityGuard;
use App\Services\SocialAccountService;
use App\Support\ApplicationSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FanLoginController extends Controller
{
    public function __construct(
        protected SocialAccountService $socialAccounts,
        protected RegistrationIdentityGuard $registrationIdentity,
    ) {}

    public function create(Request $request): Response|RedirectResponse
    {
        if ($request->user()) {
            return $this->redirectAuthenticatedFan($request);
        }

        return Inertia::render('Fan/Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']], $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'We couldn\'t sign you in. Check your email and password, or create an account if you\'re new.',
            ]);
        }

        $request->session()->regenerate();

        $user = $request->user();
        $user?->update(['last_login_at' => now()]);

        $redirect = $user?->hasAnyRole(User::ADMIN_ROLES)
            ? redirect()->intended(route('admin.dashboard'))
            : $this->redirectAuthenticatedFan($request);

        if ($user instanceof User && ! $user->hasAnyRole(User::ADMIN_ROLES)) {
            $redirect->withCookie($this->registrationIdentity->makeLockCookie($user));
        }

        return $redirect;
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user instanceof User) {
            $user->incrementTokenVersion();
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('fan.campaign');
    }

    private function redirectAuthenticatedFan(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user instanceof User && ! $user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        if ($user instanceof User
            && ApplicationSettings::socialVerificationRequired()
            && ! $this->socialAccounts->hasRequiredConnections($user)) {
            $request->session()->put('onboarding_required', true);

            return redirect()
                ->route('fan.connect-accounts', ['onboarding' => 1]);
        }

        return redirect()->intended(route('fan.dashboard'));
    }
}
