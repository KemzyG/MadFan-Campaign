<?php

namespace App\Filament\Resources\Clubs\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ClubForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Club')
                    ->schema([
                        Select::make('league_id')
                            ->label('League')
                            ->relationship('league', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('short')
                            ->label('Short code')
                            ->required()
                            ->maxLength(32),
                        FileUpload::make('logo')
                            ->image()
                            ->directory('clubs')
                            ->disk('public')
                            ->imageEditor()
                            ->maxSize(2048),
                    ])
                    ->columns(2),
            ]);
    }
}
