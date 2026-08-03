<?php

namespace App\Filament\Resources\AdminOrganizations\Schemas;

use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class AdminOrganizationForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required()
                    ->maxLength(255),

                TextInput::make('slug')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(255)
                    ->helperText('Used internally to identify this operator partition.'),

                Textarea::make('description')
                    ->rows(3)
                    ->columnSpanFull(),

                TagsInput::make('partition_countries')
                    ->label('Countries')
                    ->placeholder('Add country codes or names')
                    ->helperText('Leave empty to include all countries. Fans matching any partition rule are visible.'),

                TagsInput::make('partition_leagues')
                    ->label('Leagues')
                    ->placeholder('Add league identifiers'),

                TagsInput::make('partition_clubs')
                    ->label('Clubs')
                    ->placeholder('Add club identifiers'),

                Toggle::make('is_active')
                    ->default(true),
            ]);
    }
}
