<?php

namespace App\Filament\Resources\Jerseys\Pages;

use App\Filament\Resources\Jerseys\JerseyResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListJerseys extends ListRecords
{
    protected static string $resource = JerseyResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
