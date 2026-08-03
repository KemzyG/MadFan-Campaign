<?php

namespace App\Filament\Resources\Leagues\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class LeagueForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('League')
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('short')
                            ->label('Short code')
                            ->required()
                            ->maxLength(32)
                            ->unique(ignoreRecord: true),
                        FileUpload::make('logo')
                            ->image()
                            ->directory('leagues')
                            ->disk('public')
                            ->imageEditor()
                            ->maxSize(2048),
                    ])
                    ->columns(2),
            ]);
    }
}
