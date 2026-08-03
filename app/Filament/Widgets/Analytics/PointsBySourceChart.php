<?php

namespace App\Filament\Widgets\Analytics;

use App\Services\Analytics\AnalyticsService;
use Filament\Widgets\ChartWidget;

class PointsBySourceChart extends ChartWidget
{
    protected static bool $isDiscovered = false;

    protected static ?int $sort = 3;

    protected ?string $heading = 'Points by Source';

    protected ?string $description = 'Where fans are earning points';

    protected int|string|array $columnSpan = [
        'default' => 'full',
        'xl' => 1,
    ];

    protected function getData(): array
    {
        $analytics = app(AnalyticsService::class);
        $sources = $analytics->pointsBySource(30);
        $labels = $analytics->sourceTypeLabels();

        $chartLabels = [];
        $chartValues = [];
        $palette = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

        $index = 0;
        foreach ($sources as $source => $amount) {
            $chartLabels[] = $labels[$source] ?? ucfirst(str_replace('_', ' ', $source));
            $chartValues[] = $amount;
            $index++;
        }

        if ($chartValues === []) {
            $chartLabels = ['No data yet'];
            $chartValues = [1];
        }

        $colors = [];
        foreach (array_keys($chartValues) as $i) {
            $colors[] = $palette[$i % count($palette)];
        }

        return [
            'datasets' => [
                [
                    'data' => $chartValues,
                    'backgroundColor' => $colors,
                    'borderWidth' => 0,
                ],
            ],
            'labels' => $chartLabels,
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'position' => 'bottom',
                ],
            ],
        ];
    }
}
