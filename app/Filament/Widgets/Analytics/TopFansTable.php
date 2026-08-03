<?php

namespace App\Filament\Widgets\Analytics;

use App\Models\User;
use App\Services\Analytics\AnalyticsService;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;

class TopFansTable extends TableWidget
{
    protected static bool $isDiscovered = false;

    protected static ?int $sort = 6;

    protected int|string|array $columnSpan = [
        'default' => 'full',
        'xl' => 1,
    ];

    public function table(Table $table): Table
    {
        $topFanIds = app(AnalyticsService::class)
            ->topFans(10)
            ->pluck('id');

        return $table
            ->heading('Top Fans')
            ->description('Highest point balances')
            ->query(
                User::query()
                    ->with('loyaltyTier')
                    ->whereIn('id', $topFanIds)
                    ->orderByDesc('total_points')
            )
            ->columns([
                TextColumn::make('fan_id')
                    ->label('Fan ID')
                    ->searchable(),
                TextColumn::make('name')
                    ->label('Name')
                    ->limit(24),
                TextColumn::make('loyaltyTier.name')
                    ->label('Tier')
                    ->badge()
                    ->placeholder('—'),
                TextColumn::make('total_points')
                    ->label('Points')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('current_streak_days')
                    ->label('Streak')
                    ->suffix(' days'),
            ])
            ->paginated(false);
    }
}
