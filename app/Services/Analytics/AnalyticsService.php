<?php

namespace App\Services\Analytics;

use App\Enums\PointSourceType;
use App\Models\DailyClaim;
use App\Models\LoyaltyTier;
use App\Models\PointTransaction;
use App\Models\Referral;
use App\Models\Task;
use App\Models\User;
use App\Models\UserTaskProgress;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * @return array<int, int>
     */
    public function dailySeries(string $model, string $dateColumn, int $days = 30): array
    {
        $table = (new $model)->getTable();

        $rows = DB::table($table)
            ->selectRaw("date({$dateColumn}) as series_date, count(*) as total")
            ->where($dateColumn, '>=', now()->subDays($days - 1)->startOfDay())
            ->groupBy('series_date')
            ->orderBy('series_date')
            ->pluck('total', 'series_date');

        return $this->fillDateSeries($rows, $days);
    }

    /**
     * @return array{labels: array<int, string>, values: array<int, int|float>}
     */
    public function pointsAwardedSeries(int $days = 30): array
    {
        $rows = PointTransaction::query()
            ->selectRaw('date(created_at) as series_date, sum(amount) as total_amount')
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays($days - 1)->startOfDay())
            ->groupBy('series_date')
            ->orderBy('series_date')
            ->pluck('total_amount', 'series_date');

        $values = $this->fillDateSeries($rows, $days);

        return [
            'labels' => $this->dateLabels($days),
            'values' => array_map('intval', $values),
        ];
    }

    /**
     * @return array{labels: array<int, string>, values: array<int, int>}
     */
    public function dailyClaimsSeries(int $days = 30): array
    {
        $rows = DailyClaim::query()
            ->selectRaw('date(claim_date) as series_date, count(*) as total')
            ->where('claim_date', '>=', now()->subDays($days - 1)->startOfDay()->toDateString())
            ->groupBy('series_date')
            ->orderBy('series_date')
            ->pluck('total', 'series_date');

        return [
            'labels' => $this->dateLabels($days),
            'values' => array_map('intval', $this->fillDateSeries($rows, $days)),
        ];
    }

    /**
     * @return array<string, int>
     */
    public function pointsBySource(int $days = 30): array
    {
        return PointTransaction::query()
            ->selectRaw('source_type, sum(amount) as total_amount')
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->groupBy('source_type')
            ->orderByDesc('total_amount')
            ->pluck('total_amount', 'source_type')
            ->map(fn ($amount) => (int) $amount)
            ->toArray();
    }

    public function totalPointsDistributed(): int
    {
        return (int) PointTransaction::query()
            ->where('amount', '>', 0)
            ->sum('amount');
    }

    public function pointsFromSource(PointSourceType|string $source): int
    {
        $sourceType = $source instanceof PointSourceType ? $source->value : $source;

        return (int) PointTransaction::query()
            ->where('source_type', $sourceType)
            ->where('amount', '>', 0)
            ->sum('amount');
    }

    /**
     * @return Collection<int, LoyaltyTier>
     */
    public function loyaltyTierDistribution(): Collection
    {
        return LoyaltyTier::query()
            ->withCount('users')
            ->orderBy('display_order')
            ->get();
    }

    /**
     * @return Collection<int, User>
     */
    public function topFans(int $limit = 10): Collection
    {
        return User::query()
            ->with('loyaltyTier')
            ->orderByDesc('total_points')
            ->orderBy('id')
            ->limit($limit)
            ->get();
    }

    public function totalUsers(): int
    {
        return User::count();
    }

    public function newUsersInPeriod(int $days): int
    {
        return User::query()
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->count();
    }

    public function userGrowthPercent(int $days = 30): float
    {
        $current = $this->newUsersInPeriod($days);
        $previous = User::query()
            ->whereBetween('created_at', [
                now()->subDays($days * 2)->startOfDay(),
                now()->subDays($days)->startOfDay(),
            ])
            ->count();

        if ($previous === 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    public function pointsAwardedInPeriod(int $days): int
    {
        return (int) PointTransaction::query()
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->sum('amount');
    }

    public function dailyClaimsToday(): int
    {
        return DailyClaim::query()
            ->whereDate('claim_date', today())
            ->count();
    }

    public function activeReferralsInPeriod(int $days = 30): int
    {
        return Referral::query()
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->count();
    }

    public function taskCompletionRate(): float
    {
        $totalActiveTasks = Task::query()->where('is_active', true)->count();

        if ($totalActiveTasks === 0) {
            return 0.0;
        }

        $uniqueUsersWithClaims = UserTaskProgress::query()
            ->where('status', 'claimed')
            ->distinct('user_id')
            ->count('user_id');

        $totalUsers = max($this->totalUsers(), 1);

        return round(min(100, ($uniqueUsersWithClaims / $totalUsers) * 100), 1);
    }

    /**
     * @return array<int, int>
     */
    public function userSignupSparkline(int $days = 7): array
    {
        return array_values($this->dailySeries(User::class, 'created_at', $days));
    }

    /**
     * @return array<int, int>
     */
    public function pointsSparkline(int $days = 7): array
    {
        $series = $this->pointsAwardedSeries($days);

        return $series['values'];
    }

    /**
     * @param  Collection<string, mixed>  $rows
     * @return array<int, int|float>
     */
    private function fillDateSeries(Collection $rows, int $days): array
    {
        $series = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $series[] = $rows[$date] ?? 0;
        }

        return $series;
    }

    /**
     * @return array<int, string>
     */
    private function dateLabels(int $days): array
    {
        $labels = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $labels[] = now()->subDays($i)->format('M d');
        }

        return $labels;
    }

    /**
     * @return array<string, string>
     */
    public function sourceTypeLabels(): array
    {
        return PointSourceType::labels();
    }
}
