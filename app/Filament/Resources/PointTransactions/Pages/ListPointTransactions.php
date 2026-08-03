<?php

namespace App\Filament\Resources\PointTransactions\Pages;

use App\Filament\Resources\PointTransactions\PointTransactionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPointTransactions extends ListRecords
{
    protected static string $resource = PointTransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
