<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ApplicationSettings
{
    /**
     * @return array<string, array{label: string, description: string, type: string, section: string, options?: array<string, string>}>
     */
    public static function definitions(): array
    {
        return [
            'registration_enabled' => [
                'label' => 'Allow new registrations',
                'description' => 'When disabled, the public registration form and API signup are blocked.',
                'type' => 'boolean',
                'section' => 'registration',
            ],
            'referral_bonus_points' => [
                'label' => 'Referral bonus points',
                'description' => 'Points awarded to the referrer when someone registers with their link.',
                'type' => 'integer',
                'section' => 'referrals',
            ],
            'daily_claim_base_points' => [
                'label' => 'Daily claim base points',
                'description' => 'Base points awarded for a daily claim.',
                'type' => 'integer',
                'section' => 'loyalty',
            ],
            'shootout_window_shots' => [
                'label' => 'Shootout window shots',
                'description' => 'Scoring shots a fan can take from penalty shootouts before a cooldown starts.',
                'type' => 'integer',
                'section' => 'loyalty',
            ],
            'shootout_cooldown_minutes' => [
                'label' => 'Shootout cooldown (minutes)',
                'description' => 'Minutes a fan must wait after filling their shootout window before earning again.',
                'type' => 'integer',
                'section' => 'loyalty',
            ],
            'shootout_min_seconds_between' => [
                'label' => 'Shootout min seconds between awards',
                'description' => 'Minimum seconds between credited shootout wins (anti-farm spacing).',
                'type' => 'integer',
                'section' => 'loyalty',
            ],
            'shootout_corner_bonus_enabled' => [
                'label' => 'Shootout corner bonus (+3)',
                'description' => 'When disabled, every credited shootout win awards +1 regardless of zone (stronger anti-farm).',
                'type' => 'boolean',
                'section' => 'loyalty',
            ],
            'streak_reset_hours' => [
                'label' => 'Streak reset window (hours)',
                'description' => 'Maximum hours between claims before a streak resets.',
                'type' => 'integer',
                'section' => 'loyalty',
            ],
            'mail_mailer' => [
                'label' => 'Mail driver',
                'description' => 'Transport used to deliver outgoing email.',
                'type' => 'select',
                'section' => 'email',
                'options' => [
                    'smtp' => 'SMTP',
                    'log' => 'Log (development)',
                    'array' => 'Array (testing)',
                    'sendmail' => 'Sendmail',
                    'ses' => 'Amazon SES',
                    'postmark' => 'Postmark',
                    'resend' => 'Resend',
                    'mailgun' => 'Mailgun',
                    'failover' => 'Failover',
                    'roundrobin' => 'Round robin',
                ],
            ],
            'mail_host' => [
                'label' => 'SMTP host',
                'description' => 'Mail server hostname (for SMTP driver).',
                'type' => 'text',
                'section' => 'email',
            ],
            'mail_port' => [
                'label' => 'SMTP port',
                'description' => 'Mail server port, typically 587 for TLS or 465 for SSL.',
                'type' => 'integer',
                'section' => 'email',
            ],
            'mail_username' => [
                'label' => 'SMTP username',
                'description' => 'Authentication username for the mail server.',
                'type' => 'text',
                'section' => 'email',
            ],
            'mail_password' => [
                'label' => 'SMTP password',
                'description' => 'Leave blank to keep the current password unchanged.',
                'type' => 'password',
                'section' => 'email',
            ],
            'mail_encryption' => [
                'label' => 'Encryption',
                'description' => 'Transport encryption for SMTP connections.',
                'type' => 'select',
                'section' => 'email',
                'options' => [
                    'tls' => 'TLS',
                    'ssl' => 'SSL',
                    '' => 'None',
                ],
            ],
            'mail_from_address' => [
                'label' => 'From email address',
                'description' => 'Default sender address for system emails.',
                'type' => 'email',
                'section' => 'email',
            ],
            'mail_from_name' => [
                'label' => 'From name',
                'description' => 'Display name shown alongside the from address.',
                'type' => 'text',
                'section' => 'email',
            ],
            'send_registration_welcome_email' => [
                'label' => 'Send welcome email on registration',
                'description' => 'Email new fans after they create a passport.',
                'type' => 'boolean',
                'section' => 'email',
            ],
            'registration_welcome_email_subject' => [
                'label' => 'Welcome email subject',
                'description' => 'Subject line for the registration welcome email.',
                'type' => 'text',
                'section' => 'email',
            ],
            'social_verification_required' => [
                'label' => 'Require social account connection',
                'description' => 'When enabled, fans must connect X and Discord before using the app.',
                'type' => 'boolean',
                'section' => 'verification',
            ],
            'task_social_verification_enabled' => [
                'label' => 'Auto-verify tasks via social APIs',
                'description' => 'When enabled, task confirms call X/Discord/Telegram APIs. When disabled (recommended), fans submit for admin manual review.',
                'type' => 'boolean',
                'section' => 'verification',
            ],
            'discord_invite_url' => [
                'label' => 'Discord invite URL',
                'description' => 'Official Discord server invite link.',
                'type' => 'text',
                'section' => 'social',
            ],
            'telegram_channel_username' => [
                'label' => 'Telegram channel',
                'description' => 'Target Telegram channel username or ID used for verification.',
                'type' => 'text',
                'section' => 'social',
            ],
            'twitter_target_username' => [
                'label' => 'X (Twitter) account',
                'description' => 'Target X account handle used for follow verification.',
                'type' => 'text',
                'section' => 'social',
            ],
            'system_maintenance' => [
                'label' => 'Maintenance mode',
                'description' => 'When enabled, fan routes are blocked for regular users. Admin panel and admin accounts are unaffected.',
                'type' => 'boolean',
                'section' => 'system',
            ],
        ];
    }

    /**
     * @return array<string, array{label: string, icon: string, sections: list<string>}>
     */
    public static function segments(): array
    {
        return [
            'general' => [
                'label' => 'General Settings',
                'icon' => 'heroicon-o-cog-6-tooth',
                'sections' => ['registration', 'referrals', 'loyalty'],
            ],
            'email' => [
                'label' => 'Email Configuration',
                'icon' => 'heroicon-o-envelope',
                'sections' => ['email'],
            ],
            'social' => [
                'label' => 'Social & Verification',
                'icon' => 'heroicon-o-share',
                'sections' => ['verification', 'social'],
            ],
            'system' => [
                'label' => 'System Configuration',
                'icon' => 'heroicon-o-wrench-screwdriver',
                'sections' => ['system'],
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function sectionLabels(): array
    {
        return [
            'registration' => 'Registration',
            'referrals' => 'Referrals',
            'loyalty' => 'Loyalty & Claims',
            'email' => 'Mail Server & Notifications',
            'verification' => 'Account Verification',
            'social' => 'Platform Targets',
            'system' => 'Platform Controls',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function defaults(): array
    {
        return [
            'registration_enabled' => 'true',
            'referral_bonus_points' => '500',
            'daily_claim_base_points' => '10',
            'shootout_window_shots' => '15',
            'shootout_cooldown_minutes' => '60',
            'shootout_min_seconds_between' => '5',
            'shootout_corner_bonus_enabled' => 'false',
            'streak_reset_hours' => '48',
            'mail_mailer' => env('MAIL_MAILER', 'log'),
            'mail_host' => env('MAIL_HOST', '127.0.0.1'),
            'mail_port' => (string) env('MAIL_PORT', 2525),
            'mail_username' => env('MAIL_USERNAME', ''),
            'mail_password' => '',
            'mail_encryption' => env('MAIL_ENCRYPTION', 'tls') ?? '',
            'mail_from_address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
            'mail_from_name' => env('MAIL_FROM_NAME', 'Mad Fan'),
            'send_registration_welcome_email' => 'false',
            'registration_welcome_email_subject' => 'Welcome to Mad Fan!',
            'social_verification_required' => 'false',
            'task_social_verification_enabled' => 'false',
            'discord_invite_url' => 'https://discord.gg/madfan',
            'telegram_channel_username' => '@madfan',
            'twitter_target_username' => 'madfan',
            'system_maintenance' => 'false',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function values(): array
    {
        $stored = Setting::query()
            ->pluck('value', 'key')
            ->all();

        $values = array_merge(static::defaults(), $stored);
        $values['mail_password'] = '';

        return static::normalizeSelectValues($values);
    }

    /**
     * @param  array<string, string>  $values
     * @return array<string, string>
     */
    protected static function normalizeSelectValues(array $values): array
    {
        foreach (static::definitions() as $key => $definition) {
            if ($definition['type'] !== 'select') {
                continue;
            }

            $options = array_keys($definition['options'] ?? []);
            $current = (string) ($values[$key] ?? '');

            if (! in_array($current, $options, true)) {
                $values[$key] = static::defaults()[$key] ?? $options[0] ?? '';
            }
        }

        return $values;
    }

    public static function get(string $key, ?string $default = null): string
    {
        $values = static::values();

        return $values[$key] ?? $default ?? static::defaults()[$key] ?? '';
    }

    /**
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        $rules = [];

        foreach (static::definitions() as $key => $definition) {
            $rules[$key] = match ($definition['type']) {
                'integer' => ['nullable', 'integer', 'min:0'],
                'boolean' => ['nullable', 'boolean'],
                'email' => ['nullable', 'email', 'max:255'],
                'password' => ['nullable', 'string', 'max:255'],
                'select' => ['nullable', 'string', Rule::in(array_keys($definition['options'] ?? []))],
                default => ['nullable', 'string', 'max:500'],
            };
        }

        return $rules;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function validatePayload(array $payload): array
    {
        foreach (static::definitions() as $key => $definition) {
            if ($definition['type'] === 'boolean' && ! array_key_exists($key, $payload)) {
                $payload[$key] = false;
            }
        }

        return Validator::make($payload, static::validationRules())->validate();
    }

    public static function bool(string $key): bool
    {
        return filter_var(static::get($key), FILTER_VALIDATE_BOOLEAN);
    }

    public static function int(string $key): int
    {
        return (int) static::get($key);
    }

    public static function registrationEnabled(): bool
    {
        return static::bool('registration_enabled');
    }

    public static function sendRegistrationWelcomeEmail(): bool
    {
        return static::bool('send_registration_welcome_email');
    }

    public static function socialVerificationRequired(): bool
    {
        return static::bool('social_verification_required');
    }

    public static function taskSocialVerificationEnabled(): bool
    {
        return static::bool('task_social_verification_enabled');
    }

    public static function maintenanceMode(): bool
    {
        return static::bool('system_maintenance');
    }

    public static function referralBonusPoints(): int
    {
        return static::int('referral_bonus_points');
    }

    public static function dailyClaimBasePoints(): int
    {
        return max(1, static::int('daily_claim_base_points'));
    }

    public static function shootoutWindowShots(): int
    {
        return max(1, static::int('shootout_window_shots'));
    }

    /**
     * @deprecated Use shootoutWindowShots()
     */
    public static function shootoutWindowPoints(): int
    {
        return static::shootoutWindowShots();
    }

    public static function shootoutCooldownMinutes(): int
    {
        return max(1, static::int('shootout_cooldown_minutes'));
    }

    public static function shootoutMinSecondsBetween(): int
    {
        return max(0, static::int('shootout_min_seconds_between'));
    }

    public static function shootoutCornerBonusEnabled(): bool
    {
        return static::bool('shootout_corner_bonus_enabled');
    }

    public static function twitterTargetUsername(): string
    {
        return ltrim(static::get('twitter_target_username'), '@');
    }

    public static function telegramChannelUsername(): string
    {
        $channel = trim(static::get('telegram_channel_username'));

        if ($channel === '') {
            return '@madfan';
        }

        return str_starts_with($channel, '@') || str_starts_with($channel, '-')
            ? $channel
            : '@'.$channel;
    }

    public static function mailPassword(): ?string
    {
        $stored = Setting::query()->where('key', 'mail_password')->value('value');

        if (blank($stored)) {
            return env('MAIL_PASSWORD') ?: null;
        }

        try {
            return Crypt::decryptString($stored);
        } catch (\Throwable) {
            return $stored;
        }
    }

    /**
     * @return array<string, mixed>
     */
    public static function groupedForAdmin(): array
    {
        $definitions = static::definitions();
        $values = static::values();
        $segments = [];

        foreach (static::segments() as $segmentKey => $segment) {
            $segmentSections = [];

            foreach ($segment['sections'] as $sectionKey) {
                $fields = [];

                foreach ($definitions as $key => $definition) {
                    if ($definition['section'] !== $sectionKey) {
                        continue;
                    }

                    $fields[] = [
                        'key' => $key,
                        'label' => $definition['label'],
                        'description' => $definition['description'],
                        'type' => $definition['type'],
                        'options' => $definition['options'] ?? [],
                        'value' => $values[$key] ?? '',
                    ];
                }

                if ($fields === []) {
                    continue;
                }

                $segmentSections[] = [
                    'key' => $sectionKey,
                    'label' => static::sectionLabels()[$sectionKey] ?? $sectionKey,
                    'fields' => $fields,
                ];
            }

            $segments[] = [
                'key' => $segmentKey,
                'label' => $segment['label'],
                'icon' => $segment['icon'],
                'sections' => $segmentSections,
            ];
        }

        return $segments;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public static function sync(array $values): void
    {
        $definitions = static::definitions();

        foreach ($definitions as $key => $definition) {
            if (! array_key_exists($key, $values)) {
                continue;
            }

            $value = $values[$key];

            if ($definition['type'] === 'password' && blank($value)) {
                continue;
            }

            if ($definition['type'] === 'boolean') {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ? 'true' : 'false';
            }

            if ($definition['type'] === 'password' && filled($value)) {
                $value = Crypt::encryptString((string) $value);
            }

            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => (string) $value,
                    'description' => $definition['description'],
                    'type' => $definition['type'],
                ],
            );
        }
    }

    /**
     * Merge a partial settings form state with stored values before syncing.
     *
     * @param  array<string, mixed>  $state
     */
    public static function syncFromFormState(array $state): void
    {
        $stored = static::values();
        unset($stored['mail_password']);

        static::sync(array_merge($stored, $state));
    }
}
