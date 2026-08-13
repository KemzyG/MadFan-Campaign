<?php

namespace App\Filament\Resources\JerseyOrders\Pages;

use App\Filament\Resources\JerseyOrders\JerseyOrderResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListJerseyOrders extends ListRecords
{
    protected static string $resource = JerseyOrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
