<?php

namespace App\Filament\Resources\JerseyOrders\Schemas;

use App\Enums\JerseyOrderStatus;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class JerseyOrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Order')
                    ->schema([
                        TextInput::make('code')
                            ->disabled(),
                        Select::make('status')
                            ->options(collect(JerseyOrderStatus::cases())->mapWithKeys(
                                fn (JerseyOrderStatus $status): array => [$status->value => $status->label()],
                            )->all())
                            ->required(),
                        TextInput::make('total')
                            ->prefix('£')
                            ->disabled(),
                        TextInput::make('shipping_name')
                            ->disabled(),
                        TextInput::make('shipping_line1')
                            ->disabled(),
                        TextInput::make('shipping_line2')
                            ->disabled(),
                        TextInput::make('shipping_city')
                            ->disabled(),
                        TextInput::make('shipping_postcode')
                            ->disabled(),
                        TextInput::make('shipping_country')
                            ->disabled(),
                    ])
                    ->columns(2),
            ]);
    }
}
