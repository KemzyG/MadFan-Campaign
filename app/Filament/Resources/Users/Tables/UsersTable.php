<?php

namespace App\Filament\Resources\Users\Tables;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Filament\Resources\Users\Actions\AssignStaffPositionAction;
use App\Filament\Resources\Users\Actions\RemoveStaffPositionAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('email')
                    ->label('Email address')
                    ->searchable(),
                TextColumn::make('fan_id')
                    ->searchable(),
                TextColumn::make('staff_position')
                    ->label('Staff position')
                    ->formatStateUsing(fn (?string $state): string => $state
                        ? (StaffPosition::tryFrom($state)?->label() ?? $state)
                        : '—')
                    ->badge()
                    ->color(fn (?string $state): string => filled($state) ? 'warning' : 'gray')
                    ->sortable(),
                TextColumn::make('staff_status')
                    ->label('Staff status')
                    ->formatStateUsing(fn (?string $state): string => $state
                        ? (StaffStatus::tryFrom($state)?->label() ?? $state)
                        : '—')
                    ->badge()
                    ->color(fn (?string $state): string => match ($state) {
                        StaffStatus::Active->value => 'success',
                        StaffStatus::Inactive->value => 'danger',
                        default => 'gray',
                    })
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('loyaltyTier.name')
                    ->searchable(),
                TextColumn::make('total_points')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('referral_count')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('username')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('handle')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('club')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('country')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('last_login_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                TernaryFilter::make('is_staff')
                    ->label('Staff member'),
                SelectFilter::make('staff_position')
                    ->label('Staff position')
                    ->options(collect(StaffPosition::cases())->mapWithKeys(
                        fn (StaffPosition $position): array => [$position->value => $position->label()]
                    )->all()),
                SelectFilter::make('staff_status')
                    ->label('Staff status')
                    ->options(collect(StaffStatus::cases())->mapWithKeys(
                        fn (StaffStatus $status): array => [$status->value => $status->label()]
                    )->all()),
            ])
            ->recordActions([
                AssignStaffPositionAction::make(),
                RemoveStaffPositionAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
