<?php

namespace App\Filament\Resources\DailyClaims\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class DailyClaimForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->required(),
                Select::make('season_id')
                    ->relationship('season', 'name'),
                DatePicker::make('claim_date')
                    ->required(),
                TextInput::make('status')
                    ->required()
                    ->default('upcoming'),
                TextInput::make('base_points')
                    ->required()
                    ->numeric(),
                TextInput::make('multiplier')
                    ->required()
                    ->numeric()
                    ->default(1),
                TextInput::make('points_earned')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('streak_day_number')
                    ->required()
                    ->numeric()
                    ->default(0),
                DateTimePicker::make('claimed_at'),
                Select::make('point_transaction_id')
                    ->relationship('pointTransaction', 'id'),
            ]);
    }
}
