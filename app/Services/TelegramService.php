<?php

namespace App\Services;

use App\Support\ApplicationSettings;
use App\Support\SocialVerification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    public function verifyChannelSubscription(?string $externalHandle): bool
    {
        return $this->resolveChannelMember($externalHandle) !== null;
    }

    /**
     * @return array{user_id: string, username: ?string}|null
     */
    public function resolveChannelMember(?string $externalHandle): ?array
    {
        if (blank($externalHandle)) {
            return null;
        }

        $botToken = config('services.telegram.bot_token');

        if (empty($botToken)) {
            if (SocialVerification::allowsMockWhenCredentialsMissing()) {
                Log::warning('Telegram API bot token missing. Mocking channel verification.', [
                    'handle' => $externalHandle,
                ]);

                return $this->mockChannelMember($externalHandle);
            }

            Log::error('Telegram API bot token missing. Failing verification closed.');

            return null;
        }

        $channelUsername = $this->normalizeChannelUsername(
            ApplicationSettings::telegramChannelUsername(),
        );

        $userId = $this->resolveUserId($externalHandle, $botToken);

        if ($userId === null) {
            return null;
        }

        if (! $this->isChannelMember($channelUsername, $userId, $botToken)) {
            return null;
        }

        $username = $this->resolveUsername($externalHandle, $userId, $botToken);

        return [
            'user_id' => $userId,
            'username' => $username,
        ];
    }

    private function resolveUserId(string $handle, string $botToken): ?string
    {
        $handle = trim($handle);

        if (is_numeric($handle)) {
            return $handle;
        }

        $response = Http::get($this->apiUrl($botToken, 'getChat'), [
            'chat_id' => $this->normalizeUsername($handle),
        ]);

        if ($response->successful() && $response->json('ok')) {
            $id = $response->json('result.id');

            return filled($id) ? (string) $id : null;
        }

        Log::warning('Telegram getChat failed for username lookup.', [
            'handle' => $handle,
            'status' => $response->status(),
        ]);

        return null;
    }

    private function isChannelMember(string $channelUsername, string $userId, string $botToken): bool
    {
        $response = Http::get($this->apiUrl($botToken, 'getChatMember'), [
            'chat_id' => $channelUsername,
            'user_id' => $userId,
        ]);

        if ($response->successful() && $response->json('ok')) {
            $status = $response->json('result.status');

            return in_array($status, ['creator', 'administrator', 'member'], true);
        }

        Log::warning('Telegram getChatMember failed.', [
            'channel' => $channelUsername,
            'user_id' => $userId,
            'status' => $response->status(),
        ]);

        return false;
    }

    private function resolveUsername(string $handle, string $userId, string $botToken): ?string
    {
        if (! is_numeric(trim($handle))) {
            return $this->normalizeUsername($handle);
        }

        $response = Http::get($this->apiUrl($botToken, 'getChat'), [
            'chat_id' => $userId,
        ]);

        if ($response->successful() && $response->json('ok')) {
            $username = $response->json('result.username');

            if (filled($username)) {
                return '@'.$username;
            }
        }

        return null;
    }

    /**
     * @return array{user_id: string, username: ?string}
     */
    private function mockChannelMember(string $handle): array
    {
        $handle = trim($handle);

        if (is_numeric($handle)) {
            return [
                'user_id' => $handle,
                'username' => null,
            ];
        }

        return [
            'user_id' => '999999999',
            'username' => $this->normalizeUsername($handle),
        ];
    }

    private function normalizeUsername(string $handle): string
    {
        $handle = trim($handle);

        return str_starts_with($handle, '@') ? $handle : '@'.$handle;
    }

    private function normalizeChannelUsername(string $channel): string
    {
        $channel = trim($channel);

        if (str_starts_with($channel, '@') || str_starts_with($channel, '-')) {
            return $channel;
        }

        return '@'.$channel;
    }

    private function apiUrl(string $botToken, string $method): string
    {
        return "https://api.telegram.org/bot{$botToken}/{$method}";
    }
}
