<?php

namespace App\Support;

use App\Enums\SocialPlatform;
use App\Models\Task;
use App\Models\User;
use App\Services\SocialAccountService;
use App\Services\SocialVerificationService;

class TaskCompletionRules
{
    /**
     * @return array{
     *     requires_handle: bool,
     *     requires_proof: bool,
     *     requires_proof_url: bool,
     *     requires_post_id: bool,
     *     requires_social_connection: bool,
     *     manual_review: bool,
     *     social_platform: string|null,
     *     social_connected: bool,
     *     connected_username: string|null,
     *     handle_label: string,
     *     handle_placeholder: string,
     *     confirm_label: string,
     *     open_button_label: string|null,
     *     proof_hint: string
     * }
     */
    public static function forTask(Task $task, ?User $user = null): array
    {
        $platform = strtolower($task->platform ?? 'general');
        $taskType = strtolower($task->task_type ?? 'general');
        $settings = ApplicationSettings::values();
        $twitterHandle = '@'.ltrim($settings['twitter_target_username'] ?? 'madfan', '@');
        $socialPlatform = SocialPlatform::fromTaskPlatform($task->platform);
        $requiresSocialConnection = app(SocialVerificationService::class)->requiresSocialConnection($task);
        $socialConnected = false;
        $connectedUsername = null;

        if ($user !== null && $socialPlatform !== null) {
            $account = app(SocialAccountService::class)->get($user, $socialPlatform);
            $socialConnected = $account !== null;
            $connectedUsername = $account?->username ?? $account?->display_name;
        }

        $requiresHandle = $requiresSocialConnection && ! $socialConnected;
        $manualReview = $task->verification_required && ! ApplicationSettings::taskSocialVerificationEnabled();
        $requiresProof = $taskType === 'share' || $manualReview;

        return [
            'requires_handle' => $requiresHandle,
            // Prefer URL for share posts; image also accepted. Kept for older clients.
            'requires_proof_url' => $taskType === 'share',
            'requires_proof' => $requiresProof,
            'requires_post_id' => false,
            'requires_social_connection' => $requiresSocialConnection,
            'manual_review' => $manualReview,
            'social_platform' => $socialPlatform?->value,
            'social_connected' => $socialConnected,
            'connected_username' => $connectedUsername,
            'handle_label' => self::handleLabel($platform),
            'handle_placeholder' => self::handlePlaceholder($platform),
            'confirm_label' => self::confirmLabel($platform, $taskType, $twitterHandle),
            'open_button_label' => self::openButtonLabel($platform, $taskType),
            'proof_hint' => self::proofHint($platform, $taskType),
        ];
    }

    /**
     * @return array<string, array<int, string>>
     */
    public static function inputRules(Task $task, ?User $user = null): array
    {
        return [
            'proof_url' => ['nullable', 'url', 'max:2048'],
            'proof_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'external_handle' => ['nullable', 'string', 'max:255'],
            'external_post_id' => ['nullable', 'string', 'max:255'],
            'verification_payload' => ['nullable', 'array'],
        ];
    }

    private static function handleLabel(string $platform): string
    {
        return match ($platform) {
            'x', 'twitter' => 'Your X handle',
            'telegram' => 'Your Telegram user ID',
            'discord' => 'Your Discord username or ID',
            default => 'Your profile handle',
        };
    }

    private static function handlePlaceholder(string $platform): string
    {
        return match ($platform) {
            'x', 'twitter' => '@yourhandle',
            'telegram' => '123456789',
            'discord' => 'username or user ID',
            default => '@handle',
        };
    }

    private static function confirmLabel(string $platform, string $taskType, string $twitterHandle): string
    {
        return match (true) {
            in_array($platform, ['x', 'twitter'], true) => "I've followed {$twitterHandle} on X",
            $platform === 'telegram' => "I've joined the Telegram",
            $platform === 'discord' => "I've joined the Discord",
            $taskType === 'share' => "I've posted on X",
            default => "I've completed this task",
        };
    }

    private static function openButtonLabel(string $platform, string $taskType): ?string
    {
        return match (true) {
            in_array($platform, ['x', 'twitter'], true) => '↗ Open X Profile',
            $platform === 'telegram' => '↗ Open Telegram',
            $platform === 'discord' => '↗ Open Discord',
            $taskType === 'share' => '↗ Post on X',
            default => '↗ Open task',
        };
    }

    private static function proofHint(string $platform, string $taskType): string
    {
        return match (true) {
            $taskType === 'share' => 'Paste a link to your post, or upload a screenshot of it.',
            in_array($platform, ['x', 'twitter'], true) => 'Paste your profile or post URL, or upload a screenshot of the follow.',
            $platform === 'discord' => 'Paste an invite or server link if useful, or upload a screenshot of your membership.',
            $platform === 'telegram' => 'Paste a channel or group link if useful, or upload a screenshot of the join.',
            default => 'Paste an external URL (profile, post, or page) or upload a screenshot as proof.',
        };
    }
}
