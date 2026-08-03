<?php

namespace App\Filament\Widgets;

use App\Models\PointTransaction;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Facades\DB;

class PointsChart extends ChartWidget
{
    protected ?string $heading = 'Points Chart';

    protected function getData(): array
    {
        $data = PointTransaction::select(
            DB::raw('date(created_at) as date_only'),
            DB::raw('sum(amount) as total_amount')
        )
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date_only')
            ->orderBy('date_only')
            ->pluck('total_amount', 'date_only')
            ->toArray();

        $chartData = [];
        $labels = [];

        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $label = now()->subDays($i)->format('M d');
            $labels[] = $label;
            $chartData[] = $data[$date] ?? 0;
        }

        return [
            'datasets' => [
                [
                    'label' => 'Points Awarded',
                    'data' => $chartData,
                    'borderColor' => '#f59e0b',
                    'backgroundColor' => 'rgba(245, 158, 11, 0.1)',
                    'fill' => 'start',
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
