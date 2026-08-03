<?php

namespace App\Services;

use App\Support\ApplicationSettings;
use App\Support\SocialVerification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwitterService
{
    public function verifyFollowUser(?string $externalHandle): bool
    {
        if (empty($externalHandle)) {
            return false;
        }

        $bearerToken = config('services.twitter.bearer_token');

        if (empty($bearerToken)) {
            if (SocialVerification::allowsMockWhenCredentialsMissing()) {
                Log::warning('Twitter API Bearer Token missing. Mocking verification success.', [
                    'handle' => $externalHandle,
                ]);

                return true;
            }

            Log::error('Twitter API Bearer Token missing. Failing verification closed.');

            return false;
        }

        $targetUsername = ApplicationSettings::twitterTargetUsername();
        $cleanUserHandle = ltrim($externalHandle, '@');
        $cleanTargetHandle = ltrim($targetUsername, '@');

        $targetResponse = Http::withToken($bearerToken)
            ->get('https://api.twitter.com/2/users/by/username/'.rawurlencode($cleanTargetHandle));

        if (! $targetResponse->successful() || empty($targetResponse->json('data.id'))) {
            Log::error('Twitter API: Failed to resolve target username ID.', [
                'target' => $cleanTargetHandle,
            ]);

            return false;
        }
        $targetId = $targetResponse->json('data.id');

        $followerResponse = Http::withToken($bearerToken)
            ->get('https://api.twitter.com/2/users/by/username/'.rawurlencode($cleanUserHandle));

        if (! $followerResponse->successful() || empty($followerResponse->json('data.id'))) {
            Log::error('Twitter API: Failed to resolve follower username ID.', [
                'handle' => $cleanUserHandle,
            ]);

            return false;
        }
        $followerId = $followerResponse->json('data.id');

        $followingResponse = Http::withToken($bearerToken)
            ->get("https://api.twitter.com/2/users/{$followerId}/following");

        if ($followingResponse->successful()) {
            $data = $followingResponse->json('data') ?? [];
            foreach ($data as $following) {
                if (($following['id'] ?? null) === $targetId) {
                    return true;
                }
            }
        }

        return false;
    }
}
