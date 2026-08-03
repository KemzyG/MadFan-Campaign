<?php

namespace App\Enums;

enum PointSourceType: string
{
    case Task = 'task';
    case DailyClaim = 'daily_claim';
    case Referral = 'referral';
    case Bonus = 'bonus';
    case ClubPick = 'club_pick';
    case AdminAdjustment = 'admin_adjustment';
    case PenaltyShootout = 'penalty_shootout';

    public function label(): string
    {
        return match ($this) {
            self::Task => 'Tasks',
            self::DailyClaim => 'Daily Claims',
            self::Referral => 'Referrals',
            self::Bonus => 'Bonuses',
            self::ClubPick => 'Club Pick',
            self::AdminAdjustment => 'Adjustments',
            self::PenaltyShootout => 'Penalty Shootout',
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
     * @return array<string, string>
     */
    public static function labels(): array
    {
        $labels = [];

        foreach (self::cases() as $case) {
            $labels[$case->value] = $case->label();
        }

        return $labels;
    }

    /**
     * Sources shown in admin point-transaction filters.
     *
     * @return list<string>
     */
    public static function adminFilterValues(): array
    {
        return [
            self::DailyClaim->value,
            self::Task->value,
            self::Referral->value,
            self::Bonus->value,
            self::PenaltyShootout->value,
            self::ClubPick->value,
            self::AdminAdjustment->value,
        ];
    }
}
