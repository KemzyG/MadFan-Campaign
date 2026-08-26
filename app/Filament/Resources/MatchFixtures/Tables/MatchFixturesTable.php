<?php

namespace App\Filament\Resources\MatchFixtures\Tables;

use App\Enums\MatchStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class MatchFixturesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('homeClub.name')
                    ->label('Home')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('awayClub.name')
                    ->label('Away')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('kickoff_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (MatchStatus $state): string => match ($state) {
                        MatchStatus::Live => 'danger',
                        MatchStatus::Finished => 'success',
                        MatchStatus::Upcoming => 'gray',
                    })
                    ->sortable(),
                TextColumn::make('home_score')
                    ->label('Score')
                    ->formatStateUsing(fn ($state, $record): string => $record->home_score === null && $record->away_score === null
                        ? '—'
                        : "{$record->home_score}–{$record->away_score}"),
                TextColumn::make('competition')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(collect(MatchStatus::cases())->mapWithKeys(
                        fn (MatchStatus $status): array => [$status->value => ucfirst($status->value)]
                    )->all()),
            ])
            ->defaultSort('kickoff_at', 'desc')
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
