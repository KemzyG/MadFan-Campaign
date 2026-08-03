<?php

namespace App\Services;

use App\Enums\SocialPlatform;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class SocialAccountService
{
    /**
     * @return Collection<int, SocialAccount>
     */
    public function accounts(User $user): Collection
    {
        return $user->socialAccounts()->get()->keyBy(fn (SocialAccount $account): string => $account->platform->value);
    }

    public function get(User $user, SocialPlatform $platform): ?SocialAccount
    {
        return $user->socialAccounts()
            ->where('platform', $platform->value)
            ->first();
    }

    public function isConnected(User $user, SocialPlatform $platform): bool
    {
        return $this->get($user, $platform) !== null;
    }

    public function hasRequiredConnections(User $user): bool
    {
        foreach (SocialPlatform::required() as $platform) {
            if (! $this->isConnected($user, $platform)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return list<SocialPlatform>
     */
    public function missingRequiredPlatforms(User $user): array
    {
        return array_values(array_filter(
            SocialPlatform::required(),
            fn (SocialPlatform $platform): bool => ! $this->isConnected($user, $platform),
        ));
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function statusForUser(User $user): array
    {
        $accounts = $this->accounts($user);
        $status = [];

        foreach ([...SocialPlatform::required(), ...SocialPlatform::optional()] as $platform) {
            /** @var SocialAccount|null $account */
            $account = $accounts->get($platform->value);

            $status[$platform->value] = [
                'platform' => $platform->value,
                'label' => $platform->label(),
                'icon' => $platform->icon(),
                'required' => in_array($platform, SocialPlatform::required(), true),
                'connected' => $account !== null,
                'username' => $account?->username,
                'display_name' => $account?->display_name,
                'connected_at' => $account?->connected_at?->toIso8601String(),
                'oauth_available' => $this->oauthAvailable($platform),
            ];
        }

        return $status;
    }

    public function oauthAvailable(SocialPlatform $platform): bool
    {
        return match ($platform) {
            SocialPlatform::X => filled(config('services.twitter.client_id')) && filled(config('services.twitter.client_secret')),
            SocialPlatform::Discord => filled(config('services.discord.client_id')) && filled(config('services.discord.client_secret')),
            SocialPlatform::Telegram => filled(config('services.telegram.bot_token')) && filled(config('services.telegram.bot_username')),
        };
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function link(
        User $user,
        SocialPlatform $platform,
        string $platformUserId,
        ?string $username = null,
        ?string $displayName = null,
        array $metadata = [],
    ): SocialAccount {
        $existingOwner = SocialAccount::query()
            ->where('platform', $platform->value)
            ->where('platform_user_id', $platformUserId)
            ->where('user_id', '!=', $user->id)
            ->exists();

        if ($existingOwner) {
            throw ValidationException::withMessages([
                'platform' => ['This account is already linked to another Mad Fan profile.'],
            ]);
        }

        $account = SocialAccount::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'platform' => $platform->value,
            ],
            [
                'platform_user_id' => $platformUserId,
                'username' => $username,
                'display_name' => $displayName,
                'metadata' => $metadata ?: null,
                'connected_at' => now(),
                'verified_at' => now(),
            ],
        );

        if ($platform === SocialPlatform::X && filled($username)) {
            $user->update(['handle' => str_starts_with($username, '@') ? $username : '@'.$username]);
        }

        return $account;
    }

    public function disconnect(User $user, SocialPlatform $platform): void
    {
        if (in_array($platform, SocialPlatform::required(), true)) {
            throw ValidationException::withMessages([
                'platform' => ['X and Discord connections are required and cannot be removed.'],
            ]);
        }

        $user->socialAccounts()->where('platform', $platform->value)->delete();
    }

    public function verificationIdentifier(User $user, SocialPlatform $platform): ?string
    {
        $account = $this->get($user, $platform);

        return $account?->verificationIdentifier();
    }
}
