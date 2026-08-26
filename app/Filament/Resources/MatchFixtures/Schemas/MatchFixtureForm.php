<?php

namespace App\Filament\Resources\MatchFixtures\Schemas;

use App\Enums\MatchStatus;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class MatchFixtureForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Fixture')
                    ->schema([
                        Select::make('home_club_id')
                            ->label('Home club')
                            ->relationship('homeClub', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Select::make('away_club_id')
                            ->label('Away club')
                            ->relationship('awayClub', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        DateTimePicker::make('kickoff_at')
                            ->required(),
                        TextInput::make('venue')
                            ->maxLength(255),
                        TextInput::make('competition')
                            ->maxLength(255),
                        TextInput::make('price')
                            ->numeric()
                            ->prefix('$'),
                    ])
                    ->columns(2),

                Section::make('Result')
                    ->description('Setting a score and marking the fixture Finished resolves its match prediction automatically.')
                    ->schema([
                        Select::make('status')
                            ->options(collect(MatchStatus::cases())->mapWithKeys(
                                fn (MatchStatus $status): array => [$status->value => ucfirst($status->value)]
                            )->all())
                            ->default(MatchStatus::Upcoming->value)
                            ->required(),
                        TextInput::make('home_score')
                            ->numeric()
                            ->minValue(0),
                        TextInput::make('away_score')
                            ->numeric()
                            ->minValue(0),
                    ])
                    ->columns(3),
            ]);
    }
}
