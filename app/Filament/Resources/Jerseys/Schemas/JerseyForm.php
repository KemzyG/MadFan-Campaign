<?php

namespace App\Filament\Resources\Jerseys\Schemas;

use App\Enums\JerseySize;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class JerseyForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Jersey')
                    ->schema([
                        Select::make('club_id')
                            ->label('Club')
                            ->relationship('club', 'name')
                            ->searchable()
                            ->preload()
                            ->nullable(),
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('slug')
                            ->maxLength(255)
                            ->unique(ignoreRecord: true),
                        TextInput::make('price')
                            ->required()
                            ->numeric()
                            ->prefix('£')
                            ->minValue(0),
                        Toggle::make('is_active')
                            ->label('Active listing')
                            ->default(true),
                        Textarea::make('description')
                            ->rows(4)
                            ->columnSpanFull(),
                        FileUpload::make('image')
                            ->image()
                            ->directory('jerseys')
                            ->disk('public')
                            ->imageEditor()
                            ->maxSize(2048)
                            ->columnSpanFull(),
                    ])
                    ->columns(2),
                Section::make('Sizes & stock')
                    ->schema([
                        Repeater::make('variants')
                            ->relationship()
                            ->schema([
                                Select::make('size')
                                    ->options(collect(JerseySize::cases())->mapWithKeys(
                                        fn (JerseySize $size): array => [$size->value => $size->value],
                                    )->all())
                                    ->required(),
                                TextInput::make('stock')
                                    ->numeric()
                                    ->required()
                                    ->minValue(0)
                                    ->default(0),
                                TextInput::make('sku')
                                    ->maxLength(64),
                            ])
                            ->columns(3)
                            ->minItems(1)
                            ->defaultItems(1)
                            ->collapsible(),
                    ]),
            ]);
    }
}
