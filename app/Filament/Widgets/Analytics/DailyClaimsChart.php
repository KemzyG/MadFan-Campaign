<?php

namespace App\Filament\Widgets\Analytics;

use App\Services\Analytics\AnalyticsService;
use Filament\Widgets\ChartWidget;

class DailyClaimsChart extends ChartWidget
{
    protected static bool $isDiscovered = false;

    protected static ?int $sort = 4;

    protected ?string $heading = 'Daily Claim Activity';

    protected ?string $description = 'Streak claims per day';

    protected int|string|array $columnSpan = 'full';

    public ?string $filter = '30';

    protected function getFilters(): ?array
    {
        return [
            '7' => 'Last 7 days',
            '30' => 'Last 30 days',
        ];
    }

    protected function getData(): array
    {
        $days = (int) $this->filter;
        $series = app(AnalyticsService::class)->dailyClaimsSeries($days);

        return [
            'datasets' => [
                [
                    'label' => 'Claims',
                    'data' => $series['values'],
                    'backgroundColor' => 'rgba(59, 130, 246, 0.7)',
                    'borderColor' => '#3b82f6',
                    'borderRadius' => 6,
                ],
            ],
            'labels' => $series['labels'],
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
