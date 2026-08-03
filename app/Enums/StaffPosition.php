<?php

namespace App\Enums;

enum StaffPosition: string
{
    case Ambassador = 'ambassador';
    case CommunityManager = 'community_manager';
    case Support = 'support';
    case Management = 'management';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Ambassador => 'Ambassador',
            self::CommunityManager => 'Community Manager',
            self::Support => 'Support',
            self::Management => 'Management',
            self::Admin => 'Admin',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Ambassador => 'Represents Mad Fan in the community, drives referrals, and completes outreach campaigns.',
            self::CommunityManager => 'Moderates community channels, coordinates engagement, and supports fan events.',
            self::Support => 'Helps fans with account issues, onboarding questions, and platform guidance.',
            self::Management => 'Oversees staff initiatives, reviews performance, and coordinates cross-team goals.',
            self::Admin => 'Full staff leadership with elevated operational responsibilities across the platform.',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return list<array{value: string, label: string, description: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $position): array => [
                'value' => $position->value,
                'label' => $position->label(),
                'description' => $position->description(),
            ],
            self::cases(),
        );
    }
}
