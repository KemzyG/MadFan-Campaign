<?php

namespace App\Filament\Resources\PointTransactions\Pages;

use App\Filament\Resources\PointTransactions\PointTransactionResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPointTransaction extends EditRecord
{
    protected static string $resource = PointTransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
