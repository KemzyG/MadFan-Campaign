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
    case SocialPost = 'social_post';
    case SocialReply = 'social_reply';
    case SocialLikeReceived = 'social_like_received';
    case SocialChat = 'social_chat';
    case SocialMatchdayBonus = 'social_matchday_bonus';
    case SocialDailyTask = 'social_daily_task';
    case SocialPrediction = 'social_prediction';
    case SocialPoll = 'social_poll';

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
            self::SocialPost => 'Social Post',
            self::SocialReply => 'Social Reply',
            self::SocialLikeReceived => 'Social Like Received',
            self::SocialChat => 'Social Chat',
            self::SocialMatchdayBonus => 'Social Matchday Bonus',
            self::SocialDailyTask => 'Social Daily Tasks',
            self::SocialPrediction => 'Social Prediction',
            self::SocialPoll => 'Social Poll',
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
            self::SocialPost->value,
            self::SocialReply->value,
            self::SocialLikeReceived->value,
            self::SocialChat->value,
            self::SocialMatchdayBonus->value,
            self::SocialDailyTask->value,
            self::SocialPrediction->value,
            self::SocialPoll->value,
        ];
    }
};
