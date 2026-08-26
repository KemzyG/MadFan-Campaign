<?php

namespace App\Filament\Resources\Polls\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PollForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Poll')
                    ->schema([
                        TextInput::make('question')
                            ->required()
                            ->maxLength(255)
                            ->columnSpanFull(),
                        Select::make('fandom_id')
                            ->relationship('fandom', 'name')
                            ->preload()
                            ->placeholder('All fandoms'),
                        DateTimePicker::make('closes_at')
                            ->placeholder('Never closes'),
                        Toggle::make('is_active')
                            ->default(true),
                    ])
                    ->columns(3),

                Section::make('Options')
                    ->description('Fans pick one. Vote counts are managed by the app, not editable here.')
                    ->schema([
                        Repeater::make('options')
                            ->relationship('options')
                            ->schema([
                                TextInput::make('label')
                                    ->required()
                                    ->maxLength(255),
                            ])
                            ->columns(1)
                            ->defaultItems(2)
                            ->minItems(2)
                            ->reorderable('sort_order')
                            ->addActionLabel('Add option'),
                    ]),
            ]);
    }
}
