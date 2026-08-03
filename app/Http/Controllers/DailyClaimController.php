<?php

namespace App\Http\Controllers;

use App\Http\Requests\DailyClaimRequest;
use App\Http\Resources\DailyClaimResource;
use App\Models\DailyClaim;
use App\Models\PointTransaction;
use App\Models\Season;
use App\Models\Streak;
use App\Models\StreakMilestone;
use App\Support\ApplicationSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DailyClaimController extends Controller
{
    /**
     * Cooldown after a successful claim before the next claim is available.
     */
    private const CLAIM_COOLDOWN_HOURS = 24;

    /**
     * Maximum age of the previous claim for streak continuity.
     */
    private const STREAK_WINDOW_HOURS = 48;

    /**
     * Get daily claim status: availability, streak, milestones, and recent history.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $season = Season::where('status', 'active')->latest('starts_at')->first();

        $streak = Streak::firstOrCreate(
            ['user_id' => $user->id],
            [
                'current_streak_days' => 0,
                'best_streak_days' => 0,
                'current_multiplier' => 1.0,
            ]
        );

        $latestClaim = DailyClaim::where('user_id', $user->id)
            ->latest('claimed_at')
            ->first();

        $lastClaimedAt = $latestClaim?->claimed_at ?? $streak->last_claimed_at;
        $nextResetAt = $lastClaimedAt?->copy()->addHours(self::CLAIM_COOLDOWN_HOURS);
        $isAvailable = $nextResetAt === null || $nextResetAt->lte(now());
        $activeClaim = $isAvailable ? null : $latestClaim;

        // Base points for today (multiplied by current streak multiplier)
        $basePoints = ApplicationSettings::dailyClaimBasePoints();
        $multiplier = (float) $streak->current_multiplier;
        $pointsToday = (int) round($basePoints * $multiplier);

        // Streak milestones
        $milestones = StreakMilestone::when($season, fn ($q) => $q->where('season_id', $season->id))
            ->orderBy('day_count')
            ->get()
            ->map(fn ($m) => [
                'day_count' => $m->day_count,
                'name' => $m->name,
                'bonus_points' => $m->bonus_points,
                'multiplier' => $m->multiplier,
                'reached' => $streak->current_streak_days >= $m->day_count,
            ]);

        // Recent history (last 30 entries)
        $history = DailyClaim::where('user_id', $user->id)
            ->when($season, fn ($q) => $q->where('season_id', $season->id))
            ->latest('claim_date')
            ->limit(30)
            ->get();

        return response()->json([
            'is_available' => $isAvailable,
            'next_reset_at' => $isAvailable ? null : $nextResetAt?->toIso8601String(),
            'today_claim' => $activeClaim ? new DailyClaimResource($activeClaim) : null,
            'streak' => [
                'current_streak_days' => $streak->current_streak_days,
                'best_streak_days' => $streak->best_streak_days,
                'current_multiplier' => $multiplier,
                'current_milestone_label' => $streak->current_milestone_label,
                'last_claimed_at' => $lastClaimedAt?->toIso8601String(),
                'next_claim_reset_at' => $isAvailable ? null : $nextResetAt?->toIso8601String(),
            ],
            'points_preview' => [
                'base_points' => $basePoints,
                'multiplier' => $multiplier,
                'points_today' => $pointsToday,
            ],
            'milestones' => $milestones,
            'history' => DailyClaimResource::collection($history),
        ]);
    }

    /**
     * Perform today's daily claim, awarding points and updating streak.
     */
    public function claim(DailyClaimRequest $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();
        $season = Season::where('status', 'active')->latest('starts_at')->first();

        $latestClaim = DailyClaim::where('user_id', $user->id)
            ->latest('claimed_at')
            ->first();

        $lastClaimedAt = $latestClaim?->claimed_at;
        $nextResetAt = $lastClaimedAt?->copy()->addHours(self::CLAIM_COOLDOWN_HOURS);

        // Guard: still inside the 24-hour cooldown from the last claim
        if ($nextResetAt !== null && $nextResetAt->gt(now())) {
            return response()->json([
                'message' => 'Already claimed. Come back when the 24-hour timer ends.',
                'next_reset_at' => $nextResetAt->toIso8601String(),
            ], 409);
        }

        $idempotencyKey = $request->validated()['idempotency_key']
            ?? 'daily-claim-'.$user->id.'-'.$today;

        if (PointTransaction::where('idempotency_key', $idempotencyKey)->exists()) {
            return response()->json(['message' => 'Duplicate claim request.'], 409);
        }

        return DB::transaction(function () use ($user, $today, $season, $idempotencyKey, $lastClaimedAt) {
            $streak = Streak::firstOrCreate(
                ['user_id' => $user->id],
                ['current_streak_days' => 0, 'best_streak_days' => 0, 'current_multiplier' => 1.0]
            );

            // Continue streak if the previous claim was within the rolling 48-hour window
            if ($lastClaimedAt !== null && $lastClaimedAt->gt(now()->subHours(self::STREAK_WINDOW_HOURS))) {
                $newStreak = $streak->current_streak_days + 1;
            } else {
                $newStreak = 1;
            }

            // Resolve multiplier from streak milestones
            $milestone = StreakMilestone::when($season, fn ($q) => $q->where('season_id', $season->id))
                ->where('day_count', '<=', $newStreak)
                ->orderByDesc('day_count')
                ->first();

            $multiplier = $milestone ? (float) $milestone->multiplier : 1.0;
            $milestoneLabel = $milestone?->name;
            $basePoints = ApplicationSettings::dailyClaimBasePoints();
            $pointsEarned = (int) round($basePoints * $multiplier);

            // Award streak milestone bonus if we just hit a milestone day
            $bonusPoints = 0;
            $justHitMilestone = StreakMilestone::when($season, fn ($q) => $q->where('season_id', $season->id))
                ->where('day_count', $newStreak)
                ->first();
            if ($justHitMilestone) {
                $bonusPoints = $justHitMilestone->bonus_points;
            }

            $totalEarned = $pointsEarned + $bonusPoints;
            $newBalance = $user->total_points + $totalEarned;
            $claimedAt = now();
            $claimResetAt = $claimedAt->copy()->addHours(self::CLAIM_COOLDOWN_HOURS);

            $transaction = PointTransaction::create([
                'user_id' => $user->id,
                'season_id' => $season?->id,
                'source_type' => 'daily_claim',
                'source_id' => $today,
                'amount' => $totalEarned,
                'balance_after' => $newBalance,
                'reason' => "Daily claim (streak day {$newStreak})".($bonusPoints ? ' + milestone bonus' : ''),
                'idempotency_key' => $idempotencyKey,
            ]);

            $dailyClaim = DailyClaim::create([
                'user_id' => $user->id,
                'season_id' => $season?->id,
                'claim_date' => $today,
                'status' => 'claimed',
                'base_points' => $basePoints,
                'multiplier' => $multiplier,
                'points_earned' => $totalEarned,
                'streak_day_number' => $newStreak,
                'claimed_at' => $claimedAt,
                'point_transaction_id' => $transaction->id,
            ]);

            $bestStreak = max($streak->best_streak_days, $newStreak);

            $streak->update([
                'current_streak_days' => $newStreak,
                'best_streak_days' => $bestStreak,
                'last_claimed_at' => $claimedAt,
                'next_claim_reset_at' => $claimResetAt,
                'current_multiplier' => $multiplier,
                'current_milestone_label' => $milestoneLabel,
            ]);

            $user->update([
                'current_streak_days' => $newStreak,
                'best_streak_days' => $bestStreak,
            ]);
            $user->increment('total_points', $totalEarned);

            return response()->json([
                'message' => 'Daily claim successful!',
                'claim' => new DailyClaimResource($dailyClaim),
                'points_earned' => $totalEarned,
                'streak_day' => $newStreak,
                'milestone_bonus' => $bonusPoints,
                'new_total_points' => $newBalance,
                'next_reset_at' => $claimResetAt->toIso8601String(),
            ], 201);
        });
    }
}
