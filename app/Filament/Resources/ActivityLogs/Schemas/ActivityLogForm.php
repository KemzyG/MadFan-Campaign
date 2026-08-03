<?php

namespace App\Filament\Resources\ActivityLogs\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ActivityLogForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Event Information')
                    ->schema([
                        Select::make('user_id')
                            ->relationship('user', 'name')
                            ->disabled(),
                        TextInput::make('event')
                            ->disabled(),
                        Textarea::make('description')
                            ->disabled()
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Metadata & Context')
                    ->schema([
                        TextInput::make('ip_address')
                            ->label('IP Address')
                            ->disabled(),
                        TextInput::make('user_agent')
                            ->label('User Agent')
                            ->disabled(),
                        Textarea::make('properties')
                            ->label('Properties (JSON)')
                            ->formatStateUsing(fn ($state) => is_array($state) ? json_encode($state, JSON_PRETTY_PRINT) : $state)
                            ->disabled()
                            ->columnSpanFull()
                            ->rows(6),
                    ])
                    ->columns(2),
            ]);
    }
}
