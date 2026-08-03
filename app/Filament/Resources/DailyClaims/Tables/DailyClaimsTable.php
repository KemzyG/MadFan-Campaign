<?php

namespace App\Filament\Resources\DailyClaims\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class DailyClaimsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.name')
                    ->searchable(),
                TextColumn::make('season.name')
                    ->searchable(),
                TextColumn::make('claim_date')
                    ->date()
                    ->sortable(),
                TextColumn::make('status')
                    ->searchable(),
                TextColumn::make('base_points')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('multiplier')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('points_earned')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('streak_day_number')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('claimed_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('pointTransaction.id')
                    ->searchable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
