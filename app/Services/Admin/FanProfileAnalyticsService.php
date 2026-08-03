<?php

namespace App\Services\Admin;

use App\Models\DailyClaim;
use App\Models\PointTransaction;
use App\Models\Referral;
use App\Models\User;
use App\Models\UserTaskProgress;
use Illuminate\Support\Facades\DB;

class FanProfileAnalyticsService
{
    /**
     * Fan profile analytics and recent activity for Inertia admin.
     *
     * @return array{
     *     stats: array<string, mixed>,
     *     points_by_source: list<array{source_type: string, total: int}>,
     *     recent_transactions: list<array<string, mixed>>,
     *     recent_tasks: list<array<string, mixed>>,
     *     recent_claims: list<array<string, mixed>>,
     *     recent_referrals: list<array<string, mixed>>
     * }
     */
    public function forUser(User $user): array
    {
        $completedStatuses = ['claimed', 'completed'];
        $pendingStatuses = ['pending', 'confirmed'];
        $failedStatuses = ['failed', 'rejected'];

        $taskBase = UserTaskProgress::query()->where('user_id', $user->id);

        $pointsBySource = PointTransaction::query()
            ->select('source_type', DB::raw('SUM(amount) as total'))
            ->where('user_id', $user->id)
            ->where('amount', '>', 0)
            ->groupBy('source_type')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row): array => [
                'source_type' => (string) $row->source_type,
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        $recentTransactions = PointTransaction::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(15)
            ->get(['id', 'source_type', 'amount', 'reason', 'balance_after', 'created_at'])
            ->map(fn (PointTransaction $tx): array => [
                'id' => $tx->id,
                'source_type' => $tx->source_type,
                'amount' => (int) $tx->amount,
                'reason' => $tx->reason,
                'balance_after' => (int) $tx->balance_after,
                'created_at' => $tx->created_at?->toIso8601String(),
            ])
            ->all();

        $recentTasks = UserTaskProgress::query()
            ->with('task:id,name,code,points')
            ->where('user_id', $user->id)
            ->latest('updated_at')
            ->limit(15)
            ->get()
            ->map(fn (UserTaskProgress $progress): array => [
                'id' => $progress->id,
                'status' => $progress->status,
                'verification_status' => $progress->verification_status,
                'points_awarded' => (int) ($progress->points_awarded ?? 0),
                'task_name' => $progress->task?->name,
                'task_code' => $progress->task?->code,
                'updated_at' => $progress->updated_at?->toIso8601String(),
                'claimed_at' => $progress->claimed_at?->toIso8601String(),
            ])
            ->all();

        $recentClaims = DailyClaim::query()
            ->where('user_id', $user->id)
            ->latest('claimed_at')
            ->limit(10)
            ->get(['id', 'points_earned', 'multiplier', 'claimed_at', 'claim_date', 'streak_day_number'])
            ->map(fn (DailyClaim $claim): array => [
                'id' => $claim->id,
                'points_awarded' => (int) ($claim->points_earned ?? 0),
                'multiplier' => $claim->multiplier,
                'streak_day_number' => $claim->streak_day_number,
                'claimed_at' => $claim->claimed_at?->toIso8601String(),
                'claim_date' => $claim->claim_date?->toDateString(),
            ])
            ->all();

        $recentReferrals = Referral::query()
            ->with('referred:id,name,email,fan_id')
            ->where('referrer_user_id', $user->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (Referral $referral): array => [
                'id' => $referral->id,
                'status' => $referral->status,
                'points_awarded' => (int) ($referral->points_awarded ?? 0),
                'referred_name' => $referral->referred?->name,
                'referred_fan_id' => $referral->referred?->fan_id,
                'created_at' => $referral->created_at?->toIso8601String(),
            ])
            ->all();

        $pointsEarned = (int) PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('amount', '>', 0)
            ->sum('amount');

        $pointsSpent = (int) abs((float) PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('amount', '<', 0)
            ->sum('amount'));

        return [
            'stats' => [
                'total_points' => (int) $user->total_points,
                'points_earned' => $pointsEarned,
                'points_spent' => $pointsSpent,
                'current_streak_days' => (int) $user->current_streak_days,
                'best_streak_days' => (int) $user->best_streak_days,
                'referral_count' => (int) $user->referral_count,
                'completed_tasks' => (clone $taskBase)->whereIn('status', $completedStatuses)->count(),
                'pending_tasks' => (clone $taskBase)->whereIn('status', $pendingStatuses)->count(),
                'failed_tasks' => (clone $taskBase)->whereIn('status', $failedStatuses)->count(),
                'daily_claims_total' => DailyClaim::query()->where('user_id', $user->id)->count(),
                'daily_claims_today' => DailyClaim::query()
                    ->where('user_id', $user->id)
                    ->whereDate('claimed_at', today())
                    ->count(),
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'member_since' => $user->created_at?->toIso8601String(),
            ],
            'points_by_source' => $pointsBySource,
            'recent_transactions' => $recentTransactions,
            'recent_tasks' => $recentTasks,
            'recent_claims' => $recentClaims,
            'recent_referrals' => $recentReferrals,
        ];
    }
}
