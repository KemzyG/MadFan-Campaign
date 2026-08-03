<?php

namespace App\Filament\Resources\Seasons\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SeasonForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Season Details')
                    ->description('Primary details of the loyalty season.')
                    ->schema([
                        TextInput::make('code')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(50)
                            ->placeholder('e.g., S01'),
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('e.g., Season 01'),
                        Select::make('status')
                            ->options([
                                'draft' => 'Draft',
                                'active' => 'Active',
                                'completed' => 'Completed',
                                'archived' => 'Archived',
                            ])
                            ->required()
                            ->default('draft'),
                        DateTimePicker::make('starts_at')
                            ->required(),
                        DateTimePicker::make('ends_at')
                            ->required(),
                        TextInput::make('total_weeks')
                            ->numeric()
                            ->default(4)
                            ->required(),
                        TextInput::make('points_budget')
                            ->numeric()
                            ->placeholder('Overall budget points'),
                    ])
                    ->columns(2),

                Section::make('Season Weeks')
                    ->description('Configure individual weeks for this season.')
                    ->schema([
                        Repeater::make('seasonWeeks')
                            ->relationship('seasonWeeks')
                            ->schema([
                                TextInput::make('week_number')
                                    ->numeric()
                                    ->required()
                                    ->placeholder('1, 2, 3...'),
                                TextInput::make('code')
                                    ->required()
                                    ->placeholder('e.g., S01W1'),
                                TextInput::make('name')
                                    ->required()
                                    ->placeholder('e.g., Week 1'),
                                TextInput::make('description')
                                    ->maxLength(255),
                                DateTimePicker::make('starts_at')
                                    ->required(),
                                DateTimePicker::make('ends_at')
                                    ->required(),
                                TextInput::make('point_multiplier')
                                    ->numeric()
                                    ->default(1.00)
                                    ->required(),
                                TextInput::make('completion_bonus_points')
                                    ->numeric()
                                    ->default(0)
                                    ->required(),
                                Toggle::make('is_active')
                                    ->default(true),
                            ])
                            ->columns(2)
                            ->grid(1)
                            ->defaultItems(0)
                            ->cloneable()
                            ->collapsible()
                            ->itemLabel(fn (array $state): ?string => $state['name'] ?? null),
                    ]),
            ]);
    }
}
