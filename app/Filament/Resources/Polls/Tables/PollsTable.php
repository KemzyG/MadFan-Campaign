<?php

namespace App\Filament\Resources\Polls\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PollsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('question')
                    ->searchable()
                    ->limit(50),
                TextColumn::make('fandom.name')
                    ->label('Fandom')
                    ->placeholder('All'),
                TextColumn::make('options_count')
                    ->counts('options')
                    ->label('Options'),
                IconColumn::make('is_active')
                    ->boolean(),
                TextColumn::make('closes_at')
                    ->dateTime()
                    ->placeholder('Never'),
            ])
            ->defaultSort('id', 'desc')
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
