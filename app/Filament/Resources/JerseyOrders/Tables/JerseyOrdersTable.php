<?php

namespace App\Filament\Resources\JerseyOrders\Tables;

use App\Enums\JerseyOrderStatus;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class JerseyOrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('code')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('user.email')
                    ->label('Fan')
                    ->searchable(),
                TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (JerseyOrderStatus|string $state): string => $state instanceof JerseyOrderStatus
                        ? $state->label()
                        : JerseyOrderStatus::from($state)->label()),
                TextColumn::make('total')
                    ->money('GBP')
                    ->sortable(),
                TextColumn::make('shipping_name')
                    ->toggleable(),
                TextColumn::make('confirmed_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('id', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->options(collect(JerseyOrderStatus::cases())->mapWithKeys(
                        fn (JerseyOrderStatus $status): array => [$status->value => $status->label()],
                    )->all()),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }
}
