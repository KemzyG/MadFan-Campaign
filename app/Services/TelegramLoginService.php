<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class TelegramLoginService
{
    /**
     * @param  array<string, mixed>  $authData
     */
    public function verifyAuthData(array $authData): bool
    {
        $botToken = config('services.telegram.bot_token');

        if (empty($botToken) || empty($authData['hash'])) {
            Log::warning('Telegram login verification failed: missing bot token or hash.');

            if (app()->environment('local', 'testing') && filter_var(env('TELEGRAM_LOGIN_BYPASS', false), FILTER_VALIDATE_BOOL)) {
                return ! empty($authData['id']);
            }

            return false;
        }

        $checkHash = $authData['hash'];
        unset($authData['hash']);
        ksort($authData);

        $dataCheckString = collect($authData)
            ->map(fn (mixed $value, string $key): string => "{$key}={$value}")
            ->implode("\n");

        $secretKey = hash('sha256', $botToken, true);
        $hash = hash_hmac('sha256', $dataCheckString, $secretKey);

        if (! hash_equals($hash, $checkHash)) {
            return false;
        }

        $authDate = (int) ($authData['auth_date'] ?? 0);

        return $authDate > 0 && (time() - $authDate) <= 86400;
    }

    /**
     * @param  array<string, mixed>  $authData
     */
    public function verifyChannelMembership(array $authData): bool
    {
        if (! $this->verifyAuthData($authData)) {
            return false;
        }

        $userId = (string) ($authData['id'] ?? '');

        return app(TelegramService::class)->verifyChannelSubscription($userId);
    }
}
