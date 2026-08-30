<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RegistrationIdentityGuard;
use App\Services\SocialAccountService;
use App\Support\ApplicationSettings;
use App\Support\SocialRouting;
use App\Support\SurfaceRedirect;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class FanLoginController extends Controller
{
    public function __construct(
        protected SocialAccountService $socialAccounts,
        protected RegistrationIdentityGuard $registrationIdentity,
    ) {}

    public function create(Request $request): Response|SymfonyResponse
    {
        if ($request->user()) {
            return $this->redirectAuthenticatedFan($request);
        }

        // A guest who hit the sign-in gate on a page they were already
        // reading (see resources/js/pages/Social/components/SignInGate.jsx)
        // arrives here with `?redirect=` — seed the same session key
        // SurfaceRedirect::intended() reads after a server-enforced auth
        // redirect, so both paths land the fan back where they were.
        $redirect = $request->string('redirect')->toString();
        if (
            $redirect !== ''
            && str_starts_with($redirect, '/')
            && ! str_starts_with($redirect, '//')
            && ! str_contains($redirect, '://')
        ) {
            $request->session()->put('url.intended', $redirect);
        }

        return Inertia::render('Fan/Auth/Login');
    }

    public function store(Request $request): SymfonyResponse
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
            ? SurfaceRedirect::intended($request, route('admin.dashboard'))
            : $this->redirectAuthenticatedFan($request);

        if ($user instanceof User && ! $user->hasAnyRole(User::ADMIN_ROLES)) {
            $redirect->withCookie($this->registrationIdentity->makeLockCookie($user));
        }

        return $redirect;
    }

    public function destroy(Request $request): SymfonyResponse
    {
        $user = $request->user();

        if ($user instanceof User) {
            $user->incrementTokenVersion();
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Land on the fan login screen. On subdomains that's social.<root>/login;
        // single-host has no /social/login route, so fall back to the campaign
        // /login there. SurfaceRedirect keeps the cross-host hop CORS-safe.
        $loginUrl = SocialRouting::usesSubdomain()
            ? SocialRouting::url('login')
            : route('login');

        return SurfaceRedirect::to($request, $loginUrl);
    }

    private function redirectAuthenticatedFan(Request $request): SymfonyResponse
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

        return SurfaceRedirect::intended($request, SocialRouting::url('/'));
    }
}
