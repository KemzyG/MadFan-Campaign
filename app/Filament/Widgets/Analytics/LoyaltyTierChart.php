<?php

namespace App\Filament\Widgets\Analytics;

use App\Models\User;
use App\Services\Analytics\AnalyticsService;
use Filament\Widgets\ChartWidget;

class LoyaltyTierChart extends ChartWidget
{
    protected static bool $isDiscovered = false;

    protected static ?int $sort = 5;

    protected ?string $heading = 'Fan Tier Distribution';

    protected ?string $description = 'Fans grouped by loyalty tier';

    protected int|string|array $columnSpan = [
        'default' => 'full',
        'xl' => 1,
    ];

    protected function getData(): array
    {
        $tiers = app(AnalyticsService::class)->loyaltyTierDistribution();

        $unassigned = User::query()->whereNull('loyalty_tier_id')->count();

        $labels = $tiers->pluck('name')->all();
        $values = $tiers->pluck('users_count')->all();

        if ($unassigned > 0) {
            $labels[] = 'Unassigned';
            $values[] = $unassigned;
        }

        if ($values === []) {
            $labels = ['No fans yet'];
            $values = [1];
        }

        return [
            'datasets' => [
                [
                    'label' => 'Fans',
                    'data' => $values,
                    'backgroundColor' => ['#d97706', '#ca8a04', '#a16207', '#6b7280'],
                    'borderRadius' => 6,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }

    protected function getOptions(): array
    {
        return [
            'indexAxis' => 'y',
            'plugins' => [
                'legend' => [
                    'display' => false,
                ],
            ],
        ];
    }
}
