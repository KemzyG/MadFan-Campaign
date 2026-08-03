<?php

namespace App\Filament\Widgets\Analytics;

use App\Enums\PointSourceType;
use App\Services\Analytics\AnalyticsService;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class AnalyticsOverviewStats extends StatsOverviewWidget
{
    protected static bool $isDiscovered = false;

    protected static ?int $sort = 1;

    protected int|string|array $columnSpan = 'full';

    protected function getStats(): array
    {
        $analytics = app(AnalyticsService::class);
        $userGrowth = $analytics->userGrowthPercent();

        return [
            Stat::make('Total Fans', number_format($analytics->totalUsers()))
                ->description($userGrowth >= 0 ? "+{$userGrowth}% vs prior 30 days" : "{$userGrowth}% vs prior 30 days")
                ->descriptionIcon($userGrowth >= 0 ? 'heroicon-m-arrow-trending-up' : 'heroicon-m-arrow-trending-down')
                ->color($userGrowth >= 0 ? 'success' : 'danger')
                ->chart($analytics->userSignupSparkline()),

            Stat::make('Points (30d)', number_format($analytics->pointsAwardedInPeriod(30)))
                ->description(number_format($analytics->pointsFromSource(PointSourceType::PenaltyShootout)).' all-time from shootout')
                ->descriptionIcon('heroicon-m-sparkles')
                ->color('warning')
                ->chart($analytics->pointsSparkline()),

            Stat::make('Claims Today', number_format($analytics->dailyClaimsToday()))
                ->description('Daily streak claims')
                ->descriptionIcon('heroicon-m-fire')
                ->color('primary'),

            Stat::make('Task Engagement', $analytics->taskCompletionRate().'%')
                ->description('Fans with at least one claimed task')
                ->descriptionIcon('heroicon-m-check-badge')
                ->color('info'),
        ];
    }
}
