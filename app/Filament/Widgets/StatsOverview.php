<?php

namespace App\Filament\Widgets;

use App\Enums\PointSourceType;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use App\Services\Analytics\AnalyticsService;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        $analytics = app(AnalyticsService::class);
        $totalPoints = $analytics->totalPointsDistributed();
        $shootoutPoints = $analytics->pointsFromSource(PointSourceType::PenaltyShootout);

        return [
            Stat::make('Total Users', User::count())
                ->description('Registered fans')
                ->descriptionIcon('heroicon-m-users')
                ->color('success'),
            Stat::make('Active Seasons', Season::where('status', 'active')->count())
                ->description('Currently running seasons')
                ->descriptionIcon('heroicon-m-calendar')
                ->color('primary'),
            Stat::make('Active Tasks', Task::where('is_active', true)->count())
                ->description('Tasks available to complete')
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('warning'),
            Stat::make('Total Points Awarded', number_format($totalPoints))
                ->description(number_format($shootoutPoints).' from penalty shootout')
                ->descriptionIcon('heroicon-m-sparkles')
                ->color('info'),
        ];
    }
}
