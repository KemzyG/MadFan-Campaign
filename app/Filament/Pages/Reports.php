<?php

namespace App\Filament\Pages;

use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Widgets\Analytics\AnalyticsOverviewStats;
use App\Filament\Widgets\Analytics\DailyClaimsChart;
use App\Filament\Widgets\Analytics\LoyaltyTierChart;
use App\Filament\Widgets\Analytics\PointsBySourceChart;
use App\Filament\Widgets\Analytics\PointsTrendChart;
use App\Filament\Widgets\Analytics\TopFansTable;
use BackedEnum;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use UnitEnum;

class Reports extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChartBar;

    protected static ?int $navigationSort = 1;

    protected static ?string $navigationLabel = 'Analytics';

    protected static ?string $title = 'Analytics Dashboard';

    protected string $view = 'filament.pages.reports';

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::Analytics;
    }

    public function getSubheading(): ?string
    {
        return 'Program health, engagement trends, and fan performance at a glance.';
    }

    /**
     * @return array<class-string>
     */
    protected function getHeaderWidgets(): array
    {
        return [
            AnalyticsOverviewStats::class,
        ];
    }

    /**
     * @return array<class-string>
     */
    protected function getFooterWidgets(): array
    {
        return [
            PointsTrendChart::class,
            PointsBySourceChart::class,
            DailyClaimsChart::class,
            LoyaltyTierChart::class,
            TopFansTable::class,
        ];
    }

    public function getFooterWidgetsColumns(): int|array
    {
        return [
            'default' => 1,
            'lg' => 2,
            'xl' => 3,
        ];
    }
}
