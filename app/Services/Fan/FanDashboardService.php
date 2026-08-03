<?php

namespace App\Services\Fan;

use App\Enums\PointSourceType;
use App\Models\PointTransaction;
use App\Models\User;
use App\Models\UserTaskProgress;
use Illuminate\Support\Collection;

class FanDashboardService
{
    /**
     * @return array{
     *     summary: array<string, mixed>,
     *     by_source: list<array{source: string, label: string, count: int, total: int}>,
     *     recent_transactions: list<array<string, mixed>>,
     *     daily_series: list<array{date: string, label: string, points: int}>
     * }
     */
    public function forUser(User $user): array
    {
        $user->loadMissing('loyaltyTier');

        $totalEarned = (int) PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('amount', '>', 0)
            ->sum('amount');

        $tasksCompleted = UserTaskProgress::query()
            ->where('user_id', $user->id)
            ->where('status', 'claimed')
            ->count();

        $rank = User::query()
            ->fanAccounts()
            ->where(function ($query) use ($user) {
                $query->where('total_points', '>', $user->total_points)
                    ->orWhere(function ($query) use ($user) {
                        $query->where('total_points', $user->total_points)
                            ->where('id', '<', $user->id);
                    });
            })
            ->count() + 1;

        return [
            'summary' => [
                'total_earned' => $totalEarned,
                'balance' => (int) $user->total_points,
                'total_points' => (int) $user->total_points,
                'current_streak_days' => (int) $user->current_streak_days,
                'best_streak_days' => (int) $user->best_streak_days,
                'referral_count' => (int) $user->referral_count,
                'tasks_completed' => $tasksCompleted,
                'tier_name' => $user->loyaltyTier?->name ?? 'Core Fan',
                'rank' => $rank,
            ],
            'by_source' => $this->pointsBySource($user),
            'recent_transactions' => $this->recentTransactions($user),
            'daily_series' => $this->lastSevenDaysSeries($user),
        ];
    }

    /**
     * @return list<array{source: string, label: string, count: int, total: int}>
     */
    private function pointsBySource(User $user): array
    {
        $labels = PointSourceType::labels();

        return PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('amount', '>', 0)
            ->selectRaw('source_type, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('source_type')
            ->orderByDesc('total')
            ->get()
            ->map(function ($row) use ($labels): array {
                $source = (string) $row->source_type;

                return [
                    'source' => $source,
                    'label' => $labels[$source] ?? str($source)->replace('_', ' ')->title()->toString(),
                    'count' => (int) $row->count,
                    'total' => (int) $row->total,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentTransactions(User $user): array
    {
        $labels = PointSourceType::labels();

        return PointTransaction::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->limit(12)
            ->get(['id', 'source_type', 'amount', 'reason', 'created_at'])
            ->map(function (PointTransaction $tx) use ($labels): array {
                $source = (string) $tx->source_type;

                return [
                    'id' => $tx->id,
                    'source' => $source,
                    'label' => $labels[$source] ?? str($source)->replace('_', ' ')->title()->toString(),
                    'reason' => $tx->reason,
                    'amount' => (int) $tx->amount,
                    'created_at' => $tx->created_at?->toIso8601String(),
                ];
            })
            ->all();
    }

    /**
     * @return list<array{date: string, label: string, points: int}>
     */
    private function lastSevenDaysSeries(User $user): array
    {
        $start = now()->subDays(6)->startOfDay();

        $totals = PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('amount', '>', 0)
            ->where('created_at', '>=', $start)
            ->get(['amount', 'created_at'])
            ->groupBy(fn (PointTransaction $tx): string => $tx->created_at->toDateString())
            ->map(fn (Collection $group): int => (int) $group->sum('amount'));

        $series = [];

        for ($i = 0; $i < 7; $i++) {
            $day = $start->copy()->addDays($i);
            $key = $day->toDateString();

            $series[] = [
                'date' => $key,
                'label' => $day->format('D'),
                'points' => $totals[$key] ?? 0,
            ];
        }

        return $series;
    }
}
