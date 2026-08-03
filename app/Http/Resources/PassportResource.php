<?php

namespace App\Http\Resources;

use App\Models\LoyaltyTier;
use App\Models\ReferralMilestone;
use App\Services\SeasonService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PassportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->user;
        $season = $this->relationLoaded('season') && $this->season
            ? $this->season
            : app(SeasonService::class)->activeSeason();

        if ($season && ! $season->relationLoaded('seasonWeeks')) {
            $season->load(['seasonWeeks' => fn ($query) => $query->orderBy('week_number')]);
        }

        $activeWeek = $season?->seasonWeeks
            ?->firstWhere('is_active', true);

        // Tier progress: resolve from points so the badge stays correct even
        // when loyalty_tier_id is null or stale.
        $userPoints = (int) $user->total_points;
        $currentTier = LoyaltyTier::forPoints($userPoints) ?? $user->loyaltyTier;
        $nextTier = $currentTier
            ? $currentTier->nextTier()
            : LoyaltyTier::query()->orderBy('display_order')->first();

        $minPoints = $currentTier ? (int) $currentTier->min_points : 0;
        $maxPoints = $nextTier
            ? (int) $nextTier->min_points
            : (int) ($currentTier?->max_points ?? 0);

        $tierProgressPercent = 0;
        if ($maxPoints > $minPoints) {
            $tierProgressPercent = min(100, max(0, (($userPoints - $minPoints) / ($maxPoints - $minPoints)) * 100));
        } else {
            $tierProgressPercent = 100;
        }

        // Referral progress calculations:
        $nextMilestone = ReferralMilestone::query()
            ->where('target_count', '>', $user->referral_count)
            ->orderBy('target_count', 'asc')
            ->first();
        $refProgressPercent = 0;
        if ($nextMilestone && $nextMilestone->target_count > 0) {
            $refProgressPercent = min(100, ($user->referral_count / $nextMilestone->target_count) * 100);
        } else {
            $refProgressPercent = 100;
        }

        $streakTarget = 7;
        $streakDays = (int) $user->current_streak_days;
        $streakProgressPercent = min(100, max(0, ($streakDays / $streakTarget) * 100));

        $tasksDone = $user->userTaskProgress()
            ->where('status', 'claimed')
            ->when($season, fn ($query) => $query->where('season_id', $season->id))
            ->count();

        // Derived loyalty score as a 1–100% composite of engagement progress.
        $pointsCap = max(1, (int) (LoyaltyTier::query()->max('min_points') ?: 5000));
        $referralCap = max(1, (int) (ReferralMilestone::query()->max('target_count') ?: 50));
        $tasksCap = max(1, $season
            ? (int) $season->tasks()->count()
            : 10);

        $pointsPct = min(100, (((int) $userPoints) / $pointsCap) * 100);
        $streakPct = min(100, ($streakDays / $streakTarget) * 100);
        $referralPct = min(100, (((int) $user->referral_count) / $referralCap) * 100);
        $tasksPct = min(100, ($tasksDone / $tasksCap) * 100);

        $loyaltyScore = (int) round(
            ($pointsPct * 0.50)
            + ($streakPct * 0.20)
            + ($referralPct * 0.15)
            + ($tasksPct * 0.15)
        );
        $loyaltyScore = max(1, min(100, $loyaltyScore));

        $seasonCode = $season?->code ?: 'S01';
        $seasonLabel = $season?->name ?: $seasonCode;

        return [
            'id' => $this->id,
            'user' => [
                'name' => $user->name,
                'username' => $user->username,
                'handle' => $user->handle,
                'avatar_emoji' => $user->avatar_emoji,
                'avatar_url' => $user->avatar_url,
                'has_custom_avatar' => $user->has_custom_avatar,
                'fan_id' => $user->fan_id,
                'club' => $user->club,
                'total_points' => $user->total_points,
                'loyalty_score' => $loyaltyScore,
                'loyalty_tier' => $currentTier ? [
                    'id' => $currentTier->id,
                    'code' => $currentTier->code,
                    'name' => $currentTier->name,
                ] : null,
                'current_streak_days' => $user->current_streak_days,
                'best_streak_days' => $user->best_streak_days,
                'referral_count' => $user->referral_count,
                'created_at' => $user->created_at?->toIso8601String(),
                'joined_at' => $user->created_at?->toIso8601String(),
            ],
            'season' => [
                'id' => $season?->id,
                'code' => $seasonCode,
                'name' => $seasonLabel,
                'tag' => $seasonCode,
                'active_week' => $activeWeek ? [
                    'week_number' => $activeWeek->week_number,
                    'name' => $activeWeek->name,
                    'code' => $activeWeek->code,
                ] : null,
            ],
            'qr_value' => $this->qr_value,
            'referral_link' => $this->referral_link,
            'share_slug' => $this->share_slug,
            'is_public' => (bool) $this->is_public,
            'last_shared_at' => $this->last_shared_at,
            'loyalty_score' => [
                'total' => $loyaltyScore,
                'unit' => 'percent',
                'min' => 1,
                'max' => 100,
                'breakdown' => [
                    'points_percent' => round($pointsPct, 2),
                    'streak_percent' => round($streakPct, 2),
                    'referral_percent' => round($referralPct, 2),
                    'tasks_percent' => round($tasksPct, 2),
                ],
            ],
            'tier_progress' => [
                'current_tier' => $currentTier ? $currentTier->name : 'CORE FAN',
                'next_tier' => $nextTier ? $nextTier->name : 'MAX',
                'points_needed' => $nextTier ? max(0, $nextTier->min_points - $userPoints) : 0,
                'progress_percentage' => round($tierProgressPercent, 2),
            ],
            'referral_progress' => [
                'current_count' => $user->referral_count,
                'next_milestone_target' => $nextMilestone ? $nextMilestone->target_count : null,
                'next_milestone_reward' => $nextMilestone ? $nextMilestone->reward_name : null,
                'progress_percentage' => round($refProgressPercent, 2),
            ],
            'streak_progress' => [
                'current_days' => $streakDays,
                'target_days' => $streakTarget,
                'progress_percentage' => round($streakProgressPercent, 2),
            ],
            'stats' => [
                'tasks_done' => $tasksDone,
                'streak_days' => $streakDays,
                'referrals' => (int) $user->referral_count,
                'loyalty_score' => $loyaltyScore,
                'active_week_number' => $activeWeek?->week_number,
            ],
            'snapshots' => [
                'name' => $this->snapshot_name,
                'handle' => $this->snapshot_handle,
                'club' => $this->snapshot_club,
                'tier' => $this->snapshot_tier,
                'points' => $this->snapshot_points,
                'streak_days' => $this->snapshot_streak_days,
                'referral_count' => $this->snapshot_referral_count,
            ],
        ];
    }
}
