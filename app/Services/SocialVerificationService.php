<?php

namespace App\Services;

use App\Enums\SocialPlatform;
use App\Models\Task;
use App\Models\User;
use App\Support\ApplicationSettings;
use Illuminate\Validation\ValidationException;

class SocialVerificationService
{
    public function __construct(
        protected SocialAccountService $socialAccounts,
        protected TwitterService $twitter,
        protected DiscordService $discord,
        protected TelegramService $telegram,
    ) {}

    public function platformForTask(Task $task): ?SocialPlatform
    {
        return SocialPlatform::fromTaskPlatform($task->platform);
    }

    public function requiresSocialConnection(Task $task): bool
    {
        if (! $task->verification_required) {
            return false;
        }

        if (! ApplicationSettings::taskSocialVerificationEnabled()) {
            return false;
        }

        return $this->platformForTask($task) !== null;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function resolveIdentifier(User $user, Task $task, array $data): ?string
    {
        $platform = $this->platformForTask($task);

        if ($platform !== null) {
            $linked = $this->socialAccounts->verificationIdentifier($user, $platform);
            if (filled($linked)) {
                return $linked;
            }
        }

        if ($platform === SocialPlatform::X) {
            return $data['external_handle'] ?? $user->handle;
        }

        return $data['external_handle'] ?? null;
    }

    public function verify(Task $task, string $identifier): bool
    {
        $platform = strtolower($task->platform ?? '');

        return match (true) {
            in_array($platform, ['x', 'twitter'], true) => $this->twitter->verifyFollowUser($identifier),
            $platform === 'discord' => $this->discord->verifyJoinServer($identifier),
            $platform === 'telegram' => $this->telegram->verifyChannelSubscription($identifier),
            default => true,
        };
    }

    public function failureMessage(Task $task): string
    {
        $platform = strtolower($task->platform ?? '');

        return match (true) {
            in_array($platform, ['x', 'twitter'], true) => 'We could not verify your follow on X. Follow @madfan with your connected account, then try again.',
            $platform === 'discord' => 'We could not verify you joined our Discord server. Join with your connected account, then try again.',
            $platform === 'telegram' => 'We could not verify your Telegram channel subscription. Join the channel with your connected account, then try again.',
            default => 'We could not verify this task. Please try again.',
        };
    }

    /**
     * Verify platform membership and link the account for manual connect flows.
     */
    public function verifyAndLink(
        User $user,
        SocialPlatform $platform,
        string $identifier,
        ?string $platformUserId = null,
        ?string $displayName = null,
    ): void {
        if ($platform === SocialPlatform::Telegram) {
            $member = $this->telegram->resolveChannelMember($identifier);

            if ($member === null) {
                throw ValidationException::withMessages([
                    'identifier' => [$this->connectFailureMessage($platform)],
                ]);
            }

            $this->socialAccounts->link(
                $user,
                $platform,
                $member['user_id'],
                $member['username'],
                $displayName,
            );

            return;
        }

        $verified = match ($platform) {
            SocialPlatform::X => $this->twitter->verifyFollowUser($identifier),
            SocialPlatform::Discord => $this->discord->verifyJoinServer($identifier),
            SocialPlatform::Telegram => false,
        };

        if (! $verified) {
            throw ValidationException::withMessages([
                'identifier' => [$this->connectFailureMessage($platform)],
            ]);
        }

        $username = match ($platform) {
            SocialPlatform::X => str_starts_with($identifier, '@') ? $identifier : '@'.ltrim($identifier, '@'),
            SocialPlatform::Discord => $identifier,
            SocialPlatform::Telegram => null,
        };

        $this->socialAccounts->link(
            $user,
            $platform,
            $platformUserId ?? $identifier,
            $username,
            $displayName,
        );
    }

    private function connectFailureMessage(SocialPlatform $platform): string
    {
        return match ($platform) {
            SocialPlatform::X => 'We could not verify that you follow @madfan on X. Follow us first, then enter the correct handle.',
            SocialPlatform::Discord => 'We could not verify you joined our Discord server. Accept the invite first, then try again.',
            SocialPlatform::Telegram => 'We could not verify your Telegram username in our channel. Join our Telegram channel first, then enter your public @username.',
        };
    }
}
