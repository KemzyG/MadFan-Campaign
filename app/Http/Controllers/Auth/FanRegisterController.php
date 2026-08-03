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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FanRegisterController extends Controller
{
    public function __construct(
        protected ReferralService $referralService,
        protected FanPageDataService $fanPageData,
        protected SocialAccountService $socialAccounts,
        protected RegistrationNotificationService $registrationNotifications,
        protected RegistrationIdentityGuard $registrationIdentity,
    ) {}

    public function create(Request $request): Response|RedirectResponse
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
                return redirect()->intended(route('fan.dashboard'));
            }

            return redirect()->route('fan.connect-accounts', ['onboarding' => 1]);
        }

        if ($this->registrationIdentity->hasRegistrationLock($request)) {
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

    public function store(FanRegisterRequest $request): RedirectResponse
    {
        if (! ApplicationSettings::registrationEnabled()) {
            return redirect()
                ->route('fan.campaign')
                ->with('error', 'Registration is currently closed. Please try again later.');
        }

        $data = $request->validated();

        $this->registrationIdentity->assertCanRegister($request, $data['email']);

        $baseUsername = explode('@', $data['email'])[0];
        $username = $baseUsername;
        $count = 1;
        while (User::query()->where('username', $username)->exists()) {
            $username = $baseUsername.$count++;
        }

        $club = Club::query()
            ->with('league:id,name')
            ->where('name', $data['club'])
            ->first();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $username,
            'handle' => null,
            'club' => $club?->name ?? $data['club'],
            'league' => $club?->league?->name,
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

        $redirect = redirect()
            ->route('verification.notice')
            ->with('success', 'Passport created! Verify your email to continue.');

        if (ApplicationSettings::socialVerificationRequired()) {
            $request->session()->put('onboarding_required', true);
        }

        return $redirect->withCookie($this->registrationIdentity->makeLockCookie($user));
    }
}
