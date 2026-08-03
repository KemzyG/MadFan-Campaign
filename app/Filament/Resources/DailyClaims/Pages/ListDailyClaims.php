<?php

namespace App\Filament\Resources\DailyClaims\Pages;

use App\Filament\Resources\DailyClaims\DailyClaimResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListDailyClaims extends ListRecords
{
    protected static string $resource = DailyClaimResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
