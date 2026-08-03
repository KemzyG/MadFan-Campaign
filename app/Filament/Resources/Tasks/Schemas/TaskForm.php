<?php

namespace App\Filament\Resources\Tasks\Schemas;

use App\Enums\StaffPosition;
use App\Enums\TaskAudience;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Builder;

class TaskForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Task Details')
                    ->description('General configuration of the task.')
                    ->schema([
                        Select::make('season_id')
                            ->relationship('season', 'name')
                            ->live()
                            ->afterStateUpdated(fn (callable $set) => $set('season_week_id', null))
                            ->required(),
                        Select::make('season_week_id')
                            ->relationship('seasonWeek', 'name', modifyQueryUsing: function (Builder $query, callable $get) {
                                $seasonId = $get('season_id');
                                if ($seasonId) {
                                    return $query->where('season_id', $seasonId);
                                }

                                return $query;
                            })
                            ->placeholder('Select a week (optional)'),
                        TextInput::make('code')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(50)
                            ->placeholder('e.g., TSK001'),
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('e.g., Follow us on Twitter'),
                        TextInput::make('description')
                            ->maxLength(65535)
                            ->columnSpanFull(),
                        TextInput::make('points')
                            ->numeric()
                            ->default(100)
                            ->required(),
                        TextInput::make('display_order')
                            ->numeric()
                            ->default(0)
                            ->required(),
                        TextInput::make('platform')
                            ->placeholder('e.g., twitter, telegram, discord')
                            ->maxLength(50),
                        TextInput::make('task_type')
                            ->placeholder('e.g., follow, retweet, join')
                            ->maxLength(50),
                        TextInput::make('external_url')
                            ->url()
                            ->maxLength(255)
                            ->columnSpanFull(),
                        DateTimePicker::make('starts_at'),
                        DateTimePicker::make('ends_at'),
                        Toggle::make('verification_required')
                            ->default(false),
                        Toggle::make('is_active')
                            ->default(true),
                    ])
                    ->columns(2),

                Section::make('Staff Assignment')
                    ->description('Target staff members by position or assign to an individual staff member.')
                    ->schema([
                        Select::make('audience')
                            ->label('Audience')
                            ->options(collect(TaskAudience::cases())->mapWithKeys(
                                fn (TaskAudience $audience): array => [$audience->value => $audience->label()]
                            )->all())
                            ->default(TaskAudience::Fan->value)
                            ->live()
                            ->required(),
                        Select::make('staff_position')
                            ->label('Staff position')
                            ->options(collect(StaffPosition::cases())->mapWithKeys(
                                fn (StaffPosition $position): array => [$position->value => $position->label()]
                            )->all())
                            ->placeholder('All staff positions')
                            ->visible(fn (Get $get): bool => $get('audience') === TaskAudience::Staff->value),
                        Select::make('assigned_user_id')
                            ->label('Assigned staff member')
                            ->relationship(
                                name: 'assignedUser',
                                titleAttribute: 'name',
                                modifyQueryUsing: fn (Builder $query) => $query
                                    ->where('is_staff', true)
                                    ->where('staff_status', 'active')
                                    ->orderBy('name'),
                            )
                            ->getOptionLabelFromRecordUsing(fn ($record): string => "{$record->name} ({$record->fan_id})")
                            ->searchable(['name', 'email', 'fan_id'])
                            ->preload()
                            ->placeholder('No individual assignee')
                            ->visible(fn (Get $get): bool => $get('audience') === TaskAudience::Staff->value),
                    ])
                    ->columns(2),

                Section::make('Task Steps')
                    ->description('Configure sequential steps required to complete this task.')
                    ->schema([
                        Repeater::make('taskSteps')
                            ->relationship('taskSteps')
                            ->schema([
                                TextInput::make('step_number')
                                    ->numeric()
                                    ->required()
                                    ->placeholder('1, 2, 3...'),
                                TextInput::make('description')
                                    ->required()
                                    ->maxLength(255)
                                    ->placeholder('e.g., Click the link and authorize account'),
                                TextInput::make('link_url')
                                    ->url()
                                    ->maxLength(255),
                                TextInput::make('link_label')
                                    ->maxLength(100)
                                    ->placeholder('e.g., Connect Twitter'),
                            ])
                            ->columns(2)
                            ->grid(1)
                            ->defaultItems(0)
                            ->cloneable()
                            ->collapsible()
                            ->itemLabel(fn (array $state): ?string => isset($state['step_number']) ? 'Step '.$state['step_number'] : null),
                    ]),
            ]);
    }
}
