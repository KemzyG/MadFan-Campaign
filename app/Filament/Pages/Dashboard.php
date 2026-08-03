<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\PointsChart;
use App\Filament\Widgets\StatsOverview;
use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    public static function getNavigationLabel(): string
    {
        return 'Dashboard';
    }

    public static function getNavigationIcon(): string|\BackedEnum|null
    {
        return 'heroicon-o-home';
    }

    public function getSubheading(): ?string
    {
        return 'Quick operational snapshot. Open Analytics for full reporting.';
    }

    public function getWidgets(): array
    {
        return [
            StatsOverview::class,
            PointsChart::class,
        ];
    }
}
