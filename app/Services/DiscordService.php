<?php

namespace App\Services;

use App\Support\SocialVerification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiscordService
{
    public function verifyJoinServer(?string $externalHandle): bool
    {
        if (empty($externalHandle)) {
            return false;
        }

        $botToken = config('services.discord.bot_token');
        $guildId = config('services.discord.guild_id');

        if (empty($botToken) || empty($guildId)) {
            if (SocialVerification::allowsMockWhenCredentialsMissing()) {
                Log::warning('Discord API credentials missing. Mocking verification success.', [
                    'handle' => $externalHandle,
                ]);

                return true;
            }

            Log::error('Discord API credentials missing. Failing verification closed.');

            return false;
        }

        if (is_numeric($externalHandle)) {
            $response = Http::withToken($botToken, 'Bot')
                ->get("https://discord.com/api/v10/guilds/{$guildId}/members/{$externalHandle}");

            if ($response->successful()) {
                return true;
            }
        }

        $response = Http::withToken($botToken, 'Bot')
            ->get("https://discord.com/api/v10/guilds/{$guildId}/members/search", [
                'query' => $externalHandle,
                'limit' => 1,
            ]);

        if ($response->successful()) {
            $members = $response->json();
            if (! empty($members)) {
                foreach ($members as $member) {
                    $user = $member['user'] ?? [];
                    if (
                        strtolower($user['username'] ?? '') === strtolower($externalHandle) ||
                        strtolower(($user['username'] ?? '').'#'.($user['discriminator'] ?? '')) === strtolower($externalHandle)
                    ) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}
