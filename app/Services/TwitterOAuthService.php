<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TwitterOAuthService
{
    public function isConfigured(): bool
    {
        return filled(config('services.twitter.client_id'))
            && filled(config('services.twitter.client_secret'));
    }

    public function redirectUrl(): string
    {
        $state = Str::random(40);
        $codeVerifier = Str::random(64);
        $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');

        session([
            'social_oauth_state' => $state,
            'social_oauth_platform' => 'x',
            'twitter_code_verifier' => $codeVerifier,
        ]);

        $query = http_build_query([
            'response_type' => 'code',
            'client_id' => config('services.twitter.client_id'),
            'redirect_uri' => route('fan.social.callback', ['platform' => 'x']),
            'scope' => 'tweet.read users.read follows.read offline.access',
            'state' => $state,
            'code_challenge' => $codeChallenge,
            'code_challenge_method' => 'S256',
        ]);

        return "https://twitter.com/i/oauth2/authorize?{$query}";
    }

    /**
     * @return array{id: string, username: string, name: ?string}|null
     */
    public function fetchUserFromCallback(string $code): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $codeVerifier = session('twitter_code_verifier');

        if (! is_string($codeVerifier)) {
            return null;
        }

        $tokenResponse = Http::asForm()
            ->withBasicAuth(
                (string) config('services.twitter.client_id'),
                (string) config('services.twitter.client_secret'),
            )
            ->post('https://api.twitter.com/2/oauth2/token', [
                'code' => $code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => route('fan.social.callback', ['platform' => 'x']),
                'code_verifier' => $codeVerifier,
            ]);

        session()->forget('twitter_code_verifier');

        if (! $tokenResponse->successful()) {
            Log::error('Twitter OAuth token exchange failed.', [
                'status' => $tokenResponse->status(),
            ]);

            return null;
        }

        $accessToken = $tokenResponse->json('access_token');
        $userResponse = Http::withToken($accessToken)->get('https://api.twitter.com/2/users/me');

        if (! $userResponse->successful()) {
            return null;
        }

        $user = $userResponse->json('data') ?? [];

        return [
            'id' => (string) ($user['id'] ?? ''),
            'username' => (string) ($user['username'] ?? ''),
            'name' => $user['name'] ?? null,
        ];
    }
}
