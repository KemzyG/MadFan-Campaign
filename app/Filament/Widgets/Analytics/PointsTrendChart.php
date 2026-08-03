<?php

namespace App\Filament\Widgets\Analytics;

use App\Services\Analytics\AnalyticsService;
use Filament\Widgets\ChartWidget;

class PointsTrendChart extends ChartWidget
{
    protected static bool $isDiscovered = false;

    protected static ?int $sort = 2;

    protected ?string $heading = 'Points Awarded';

    protected ?string $description = 'Daily point volume across the loyalty program';

    protected int|string|array $columnSpan = [
        'default' => 'full',
        'xl' => 2,
    ];

    public ?string $filter = '30';

    protected function getFilters(): ?array
    {
        return [
            '7' => 'Last 7 days',
            '30' => 'Last 30 days',
            '90' => 'Last 90 days',
        ];
    }

    protected function getData(): array
    {
        $days = (int) $this->filter;
        $series = app(AnalyticsService::class)->pointsAwardedSeries($days);

        return [
            'datasets' => [
                [
                    'label' => 'Points awarded',
                    'data' => $series['values'],
                    'borderColor' => '#f59e0b',
                    'backgroundColor' => 'rgba(245, 158, 11, 0.15)',
                    'fill' => true,
                    'tension' => 0.35,
                    'pointRadius' => 2,
                    'pointHoverRadius' => 5,
                ],
            ],
            'labels' => $series['labels'],
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
