<?php

namespace App\Http\Controllers;

use App\Enums\SocialPlatform;
use App\Http\Requests\VerifySocialAccountRequest;
use App\Models\User;
use App\Services\DiscordOAuthService;
use App\Services\Fan\FanPageDataService;
use App\Services\SocialAccountService;
use App\Services\SocialVerificationService;
use App\Services\TelegramLoginService;
use App\Services\TwitterOAuthService;
use App\Services\TwitterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SocialConnectController extends Controller
{
    public function __construct(
        protected SocialAccountService $socialAccounts,
        protected SocialVerificationService $socialVerification,
        protected TwitterOAuthService $twitterOAuth,
        protected DiscordOAuthService $discordOAuth,
        protected TelegramLoginService $telegramLogin,
        protected FanPageDataService $fanPageData,
    ) {}

    public function redirect(Request $request, string $platform): RedirectResponse
    {
        $socialPlatform = SocialPlatform::from($platform);

        if ($request->filled('return_to')) {
            session(['social_return_to' => $request->input('return_to')]);
        }

        $url = match ($socialPlatform) {
            SocialPlatform::X => $this->twitterOAuth->isConfigured() ? $this->twitterOAuth->redirectUrl() : null,
            SocialPlatform::Discord => $this->discordOAuth->isConfigured() ? $this->discordOAuth->redirectUrl() : null,
            SocialPlatform::Telegram => null,
        };

        if ($url === null) {
            return $this->redirectAfterConnect($request, 'OAuth is not configured for this platform. Use manual verification instead.', 'error');
        }

        return redirect()->away($url);
    }

    public function callback(Request $request, string $platform): RedirectResponse
    {
        $socialPlatform = SocialPlatform::from($platform);
        $user = $request->user();

        if ($request->input('state') !== session('social_oauth_state')) {
            throw ValidationException::withMessages([
                'platform' => ['OAuth state mismatch. Please try connecting again.'],
            ]);
        }

        session()->forget(['social_oauth_state', 'social_oauth_platform']);

        if ($request->filled('error')) {
            return $this->redirectAfterConnect($request, 'Connection was cancelled. Please try again.', 'error');
        }

        $code = (string) $request->input('code', '');

        if ($code === '') {
            throw ValidationException::withMessages([
                'platform' => ['Missing authorization code from provider.'],
            ]);
        }

        match ($socialPlatform) {
            SocialPlatform::X => $this->handleTwitterCallback($user, $code),
            SocialPlatform::Discord => $this->handleDiscordCallback($user, $code),
            SocialPlatform::Telegram => throw ValidationException::withMessages([
                'platform' => ['Telegram uses the login widget, not OAuth redirect.'],
            ]),
        };

        return $this->redirectAfterConnect($request, $socialPlatform->label().' connected successfully.');
    }

    public function verifyManual(VerifySocialAccountRequest $request): RedirectResponse
    {
        $user = $request->user();
        $platform = SocialPlatform::from($request->validated('platform'));
        $identifier = trim($request->validated('identifier'));

        $this->socialVerification->verifyAndLink($user, $platform, $identifier);

        return $this->redirectAfterConnect($request, $platform->label().' connected and verified.');
    }

    public function telegramWidget(Request $request): RedirectResponse
    {
        $user = $request->user();
        $authData = $request->validate([
            'id' => ['required', 'numeric'],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255'],
            'photo_url' => ['nullable', 'url', 'max:2048'],
            'auth_date' => ['required', 'integer'],
            'hash' => ['required', 'string', 'max:255'],
            'return_to' => ['nullable', 'string', Rule::in(['connect', 'passport', 'manage', 'onboarding', 'register'])],
        ]);

        if (! $this->telegramLogin->verifyChannelMembership($authData)) {
            throw ValidationException::withMessages([
                'telegram' => ['Telegram login failed or channel membership could not be verified.'],
            ]);
        }

        $displayName = trim(collect([$authData['first_name'] ?? null, $authData['last_name'] ?? null])->filter()->implode(' '));

        $this->socialAccounts->link(
            $user,
            SocialPlatform::Telegram,
            (string) $authData['id'],
            isset($authData['username']) ? '@'.$authData['username'] : null,
            $displayName !== '' ? $displayName : null,
            $authData,
        );

        return $this->redirectAfterConnect($request, 'Telegram connected successfully.');
    }

    public function disconnect(Request $request, string $platform): RedirectResponse
    {
        $this->socialAccounts->disconnect($request->user(), SocialPlatform::from($platform));

        return $this->redirectAfterConnect($request, 'Telegram disconnected.');
    }

    private function redirectAfterConnect(Request $request, string $message, string $flashKey = 'success'): RedirectResponse
    {
        $returnTo = $request->input('return_to') ?? session('social_return_to', 'connect');
        session()->forget('social_return_to');

        $route = match ($returnTo) {
            'passport' => route('fan.passport'),
            'register' => route('fan.connect-accounts', ['onboarding' => 1]),
            'onboarding' => route('fan.connect-accounts', ['onboarding' => 1]),
            'manage' => route('fan.connect-accounts', ['manage' => 1]),
            default => route('fan.connect-accounts'),
        };

        return redirect($route)->with($flashKey, $message);
    }

    private function handleTwitterCallback(User $user, string $code): void
    {
        $profile = $this->twitterOAuth->fetchUserFromCallback($code);

        if ($profile === null || $profile['id'] === '' || $profile['username'] === '') {
            throw ValidationException::withMessages([
                'platform' => ['Unable to fetch your X profile. Please try again.'],
            ]);
        }

        $handle = '@'.ltrim($profile['username'], '@');

        if (! app(TwitterService::class)->verifyFollowUser($handle)) {
            throw ValidationException::withMessages([
                'platform' => ['Follow @madfan on X before connecting your account.'],
            ]);
        }

        $this->socialAccounts->link(
            $user,
            SocialPlatform::X,
            $profile['id'],
            $handle,
            $profile['name'] ?? null,
        );
    }

    private function handleDiscordCallback(User $user, string $code): void
    {
        $profile = $this->discordOAuth->fetchUserFromCallback($code);

        if ($profile === null || $profile['id'] === '') {
            throw ValidationException::withMessages([
                'platform' => ['Unable to fetch your Discord profile. Please try again.'],
            ]);
        }

        if (! $this->discordOAuth->verifyGuildMembership($profile['id'])) {
            throw ValidationException::withMessages([
                'platform' => ['Join our Discord server before connecting your account.'],
            ]);
        }

        $this->socialAccounts->link(
            $user,
            SocialPlatform::Discord,
            $profile['id'],
            $profile['username'],
            $profile['global_name'] ?? null,
        );
    }
}
