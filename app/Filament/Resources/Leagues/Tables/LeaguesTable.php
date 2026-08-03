<?php

namespace App\Filament\Resources\Leagues\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class LeaguesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('logo')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl(null),
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('short')
                    ->label('Short')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('clubs_count')
                    ->counts('clubs')
                    ->label('Clubs')
                    ->sortable(),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
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
