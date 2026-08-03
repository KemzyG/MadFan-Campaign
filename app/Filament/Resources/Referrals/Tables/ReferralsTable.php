<?php

namespace App\Filament\Resources\Referrals\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ReferralsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('referrer.name')
                    ->label('Referrer')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('referred.name')
                    ->label('Referee User')
                    ->searchable()
                    ->sortable()
                    ->placeholder('Not registered'),
                TextColumn::make('referred_email')
                    ->label('Referee Email')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('referral_code')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'completed' => 'success',
                        'pending' => 'warning',
                        'invalid' => 'danger',
                        default => 'gray',
                    })
                    ->sortable(),
                TextColumn::make('points_awarded')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('activated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('rewarded_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'completed' => 'Completed',
                        'invalid' => 'Invalid',
                    ]),
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
