<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\FanRegisterRequest;
use App\Models\Club;
use App\Models\User;
use App\Services\Fan\FanPageDataService;
use App\Services\ReferralService;
use App\Services\RegistrationIdentityGuard;
use App\Services\RegistrationNotificationService;
use App\Services\SocialAccountService;
use App\Support\ApplicationSettings;
use App\Support\CloudinaryImageStorage;
use App\Support\SocialRouting;
use App\Support\SurfaceRedirect;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class FanRegisterController extends Controller
{
    public function __construct(
        protected ReferralService $referralService,
        protected FanPageDataService $fanPageData,
        protected SocialAccountService $socialAccounts,
        protected RegistrationNotificationService $registrationNotifications,
        protected RegistrationIdentityGuard $registrationIdentity,
    ) {}

    public function create(Request $request): Response|SymfonyResponse
    {
        if (! ApplicationSettings::registrationEnabled()) {
            return redirect()
                ->route('fan.campaign')
                ->with('error', 'Registration is currently closed. Please try again later.');
        }

        if ($request->user() instanceof User) {
            if (! $request->user()->hasVerifiedEmail()) {
                return redirect()->route('verification.notice');
            }

            if (! ApplicationSettings::socialVerificationRequired()
                || $this->socialAccounts->hasRequiredConnections($request->user())) {
                return SurfaceRedirect::intended($request, SocialRouting::url('/'));
            }

            return redirect()->route('fan.connect-accounts', ['onboarding' => 1]);
        }

        if ($this->registrationIdentity->enforcementActive()
            && $this->registrationIdentity->hasRegistrationLock($request)) {
            return Inertia::render('Fan/Auth/Register', [
                'email' => (string) $request->session()->get('waitlist_email', $request->input('email', '')),
                'referrer_fan_id' => $this->referralService->resolveReferrerFanId(),
                'clubs' => $this->fanPageData->clubs(),
                'registration_blocked' => true,
                'registration_blocked_message' => 'This device already has a Mad Fan account. Sign in to finish connecting your accounts or continue.',
            ]);
        }

        return Inertia::render('Fan/Auth/Register', [
            'email' => (string) $request->session()->get('waitlist_email', $request->input('email', '')),
            'referrer_fan_id' => $this->referralService->resolveReferrerFanId(),
            'clubs' => $this->fanPageData->clubs(),
            'registration_blocked' => false,
            'registration_blocked_message' => null,
        ]);
    }

    public function store(FanRegisterRequest $request): SymfonyResponse
    {
        if (! ApplicationSettings::registrationEnabled()) {
            return redirect()
                ->route('fan.campaign')
                ->with('error', 'Registration is currently closed. Please try again later.');
        }

        $data = $request->validated();

        $this->registrationIdentity->assertCanRegister($request, $data['email']);

        $club = Club::query()
            ->with('league:id,name')
            ->where('name', $data['club'])
            ->first();

        $avatarPath = $request->hasFile('avatar')
            ? CloudinaryImageStorage::replace(null, $request->file('avatar'), 'avatars')
            : null;

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'],
            'handle' => null,
            'club' => $club?->name ?? $data['club'],
            'league' => $club?->league?->name,
            'bio' => $data['bio'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'avatar_path' => $avatarPath,
            'password_hash' => Hash::make($data['password']),
            'auth_provider' => 'password',
            'fan_id' => 'MF-'.strtoupper(Str::random(5)),
            ...$this->registrationIdentity->identityAttributes($request, $data['email']),
        ]);

        $this->referralService->attributeReferral($user, $data['referrer_fan_id'] ?? null);

        // Log in before side effects so a mail/SMTP failure cannot leave a created
        // account without an authenticated session (which bounced fans to /login).
        Auth::login($user);
        $request->session()->regenerate();

        $user->sendEmailVerificationNotification();
        $this->registrationNotifications->sendWelcomeEmail($user);

        if (ApplicationSettings::socialVerificationRequired()) {
            $request->session()->put('onboarding_required', true);
        }

        if (! config('auth.email_verification_enabled')) {
            if (ApplicationSettings::socialVerificationRequired()) {
                return redirect()->route('fan.connect-accounts', ['onboarding' => 1])
                    ->with('success', 'Passport created! Connect your accounts to continue.')
                    ->withCookie($this->registrationIdentity->makeLockCookie($user));
            }

            // The social home lives on another origin, so flash to the shared
            // session and let Inertia do a full-page visit instead of a doomed
            // cross-origin 302 that the browser's CORS check would kill.
            $request->session()->flash('success', 'Passport created! Welcome to Mad Fan.');

            return SurfaceRedirect::intended($request, SocialRouting::url('/'))
                ->withCookie($this->registrationIdentity->makeLockCookie($user));
        }

        return redirect()
            ->route('verification.notice')
            ->with('success', 'Passport created! Verify your email to continue.')
            ->withCookie($this->registrationIdentity->makeLockCookie($user));
    }
}
