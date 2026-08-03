<?php

namespace App\Filament\Resources\TierRewards\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class TierRewardForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('loyalty_tier_id')
                    ->relationship('loyaltyTier', 'name')
                    ->required(),
                TextInput::make('reward_text')
                    ->required(),
                TextInput::make('display_order')
                    ->required()
                    ->numeric(),
            ]);
    }
}
