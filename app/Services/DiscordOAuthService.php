<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DiscordOAuthService
{
    public function isConfigured(): bool
    {
        return filled(config('services.discord.client_id'))
            && filled(config('services.discord.client_secret'));
    }

    public function redirectUrl(): string
    {
        $state = Str::random(40);
        session([
            'social_oauth_state' => $state,
            'social_oauth_platform' => 'discord',
        ]);

        $query = http_build_query([
            'client_id' => config('services.discord.client_id'),
            'redirect_uri' => route('fan.social.callback', ['platform' => 'discord']),
            'response_type' => 'code',
            'scope' => 'identify guilds.members.read',
            'state' => $state,
            'prompt' => 'consent',
        ]);

        return "https://discord.com/api/oauth2/authorize?{$query}";
    }

    /**
     * @return array{id: string, username: string, global_name: ?string}|null
     */
    public function fetchUserFromCallback(string $code): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $tokenResponse = Http::asForm()->post('https://discord.com/api/oauth2/token', [
            'client_id' => config('services.discord.client_id'),
            'client_secret' => config('services.discord.client_secret'),
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => route('fan.social.callback', ['platform' => 'discord']),
        ]);

        if (! $tokenResponse->successful()) {
            Log::error('Discord OAuth token exchange failed.', [
                'status' => $tokenResponse->status(),
            ]);

            return null;
        }

        $accessToken = $tokenResponse->json('access_token');

        $userResponse = Http::withToken($accessToken)->get('https://discord.com/api/users/@me');

        if (! $userResponse->successful()) {
            return null;
        }

        $user = $userResponse->json();

        return [
            'id' => (string) ($user['id'] ?? ''),
            'username' => (string) ($user['username'] ?? ''),
            'global_name' => $user['global_name'] ?? null,
        ];
    }

    public function verifyGuildMembership(string $discordUserId): bool
    {
        return app(DiscordService::class)->verifyJoinServer($discordUserId);
    }
}
