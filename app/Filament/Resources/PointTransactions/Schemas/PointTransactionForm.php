<?php

namespace App\Filament\Resources\PointTransactions\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class PointTransactionForm
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
                TextInput::make('source_type')
                    ->required(),
                TextInput::make('source_id'),
                TextInput::make('amount')
                    ->required()
                    ->numeric(),
                TextInput::make('balance_after')
                    ->required()
                    ->numeric(),
                TextInput::make('reason')
                    ->required(),
                Textarea::make('metadata')
                    ->columnSpanFull(),
                TextInput::make('idempotency_key'),
            ]);
    }
}
