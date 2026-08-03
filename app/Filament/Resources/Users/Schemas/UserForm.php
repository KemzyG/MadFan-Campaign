<?php

namespace App\Filament\Resources\Users\Schemas;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Models\User;
use App\Services\Staff\StaffPerformanceService;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Validation\Rules\Password;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Fan profile')
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('email')
                            ->label('Email address')
                            ->email()
                            ->required()
                            ->unique(table: User::class, ignoreRecord: true)
                            ->maxLength(255),
                        TextInput::make('password')
                            ->password()
                            ->revealable()
                            ->rule(Password::defaults())
                            ->dehydrated(fn (?string $state): bool => filled($state))
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->helperText('Leave blank to keep the existing password when editing.'),
                        TextInput::make('handle')
                            ->maxLength(50),
                        TextInput::make('club')
                            ->maxLength(100),
                        TextInput::make('country')
                            ->maxLength(100),
                        TextInput::make('league')
                            ->maxLength(100),
                        TextInput::make('avatar_emoji')
                            ->maxLength(10),
                        Select::make('loyalty_tier_id')
                            ->relationship('loyaltyTier', 'name')
                            ->searchable()
                            ->preload(),
                    ])
                    ->columns(2),

                Section::make('Staff information')
                    ->description('Operational staff role separate from admin panel access. Use the header actions to assign or remove a position.')
                    ->visible(fn (string $operation): bool => $operation === 'edit')
                    ->schema([
                        Placeholder::make('staff_position_display')
                            ->label('Position')
                            ->content(fn (?User $record): string => $record?->is_staff
                                ? (StaffPosition::tryFrom((string) $record->staff_position)?->label() ?? '—')
                                : 'Regular user'),
                        Placeholder::make('staff_status_display')
                            ->label('Status')
                            ->content(fn (?User $record): string => $record?->is_staff
                                ? (StaffStatus::tryFrom((string) $record->staff_status)?->label() ?? '—')
                                : '—'),
                        Placeholder::make('staff_assigned_at_display')
                            ->label('Assigned at')
                            ->content(fn (?User $record): string => $record?->staff_position_assigned_at?->format('M j, Y g:i A') ?? '—'),
                        Placeholder::make('staff_assigned_by_display')
                            ->label('Assigned by')
                            ->content(fn (?User $record): string => $record?->staffPositionAssignedBy?->name ?? '—'),
                    ])
                    ->columns(2),

                Section::make('Staff performance')
                    ->visible(fn (string $operation, ?User $record): bool => $operation === 'edit' && (bool) $record?->is_staff)
                    ->schema([
                        Placeholder::make('staff_total_points')
                            ->label('Total points')
                            ->content(fn (?User $record): string => number_format((int) ($record?->total_points ?? 0))),
                        Placeholder::make('staff_total_referrals')
                            ->label('Referrals')
                            ->content(fn (?User $record): string => (string) (int) ($record?->referral_count ?? 0)),
                        Placeholder::make('staff_completed_tasks')
                            ->label('Completed tasks')
                            ->content(fn (?User $record): string => $record
                                ? (string) app(StaffPerformanceService::class)->forUser($record)['completed_tasks']
                                : '0'),
                        Placeholder::make('staff_pending_tasks')
                            ->label('Pending tasks')
                            ->content(fn (?User $record): string => $record
                                ? (string) app(StaffPerformanceService::class)->forUser($record)['pending_tasks']
                                : '0'),
                        Placeholder::make('staff_performance_score')
                            ->label('Performance score')
                            ->content(fn (?User $record): string => $record
                                ? (string) app(StaffPerformanceService::class)->forUser($record)['performance_score']
                                : '0'),
                        Placeholder::make('staff_rank')
                            ->label('Staff rank')
                            ->content(fn (?User $record): string => $record
                                ? '#'.app(StaffPerformanceService::class)->forUser($record)['staff_rank']
                                : '—'),
                    ])
                    ->columns(3),
            ]);
    }
}
