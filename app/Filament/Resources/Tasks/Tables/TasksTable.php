<?php

namespace App\Filament\Resources\Tasks\Tables;

use App\Enums\StaffPosition;
use App\Enums\TaskAudience;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class TasksTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('code')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->limit(30),
                TextColumn::make('audience')
                    ->label('Audience')
                    ->formatStateUsing(fn (?string $state): string => $state
                        ? (TaskAudience::tryFrom($state)?->label() ?? $state)
                        : TaskAudience::Fan->label())
                    ->badge()
                    ->color(fn (?string $state): string => ($state ?? TaskAudience::Fan->value) === TaskAudience::Staff->value ? 'warning' : 'info')
                    ->sortable(),
                TextColumn::make('staff_position')
                    ->label('Staff position')
                    ->formatStateUsing(fn (?string $state): string => $state
                        ? (StaffPosition::tryFrom($state)?->label() ?? $state)
                        : '—')
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('assignedUser.name')
                    ->label('Assigned to')
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('season.name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('seasonWeek.name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('points')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('platform')
                    ->badge()
                    ->searchable()
                    ->sortable(),
                TextColumn::make('task_type')
                    ->badge()
                    ->searchable()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                IconColumn::make('is_active')
                    ->boolean()
                    ->sortable(),
                IconColumn::make('verification_required')
                    ->boolean()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('display_order')
                    ->numeric()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('starts_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('ends_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('season')
                    ->relationship('season', 'name'),
                SelectFilter::make('audience')
                    ->options(collect(TaskAudience::cases())->mapWithKeys(
                        fn (TaskAudience $audience): array => [$audience->value => $audience->label()]
                    )->all()),
                TernaryFilter::make('is_active')
                    ->label('Active Status'),
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
