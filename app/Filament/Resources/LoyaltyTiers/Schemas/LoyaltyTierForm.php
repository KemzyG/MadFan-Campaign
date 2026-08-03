<?php

namespace App\Filament\Resources\LoyaltyTiers\Schemas;

use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class LoyaltyTierForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Tier Details')
                    ->description('Configuration of the loyalty tier limits.')
                    ->schema([
                        TextInput::make('code')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(50)
                            ->placeholder('e.g., BRONZE_FAN'),
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('e.g., Bronze Fan'),
                        TextInput::make('min_points')
                            ->numeric()
                            ->required()
                            ->default(0),
                        TextInput::make('max_points')
                            ->numeric()
                            ->required()
                            ->default(999),
                        TextInput::make('display_order')
                            ->numeric()
                            ->required()
                            ->default(0),
                    ])
                    ->columns(2),

                Section::make('Tier Rewards')
                    ->description('Rewards given to users in this tier.')
                    ->schema([
                        Repeater::make('tierRewards')
                            ->relationship('tierRewards')
                            ->schema([
                                TextInput::make('reward_text')
                                    ->required()
                                    ->maxLength(255)
                                    ->placeholder('e.g., 5% bonus points on all claims'),
                                TextInput::make('display_order')
                                    ->numeric()
                                    ->required()
                                    ->default(0),
                            ])
                            ->columns(2)
                            ->grid(1)
                            ->defaultItems(0)
                            ->cloneable()
                            ->collapsible()
                            ->itemLabel(fn (array $state): ?string => $state['reward_text'] ?? null),
                    ]),
            ]);
    }
}
