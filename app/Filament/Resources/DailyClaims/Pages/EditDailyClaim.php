<?php

namespace App\Filament\Resources\DailyClaims\Pages;

use App\Filament\Resources\DailyClaims\DailyClaimResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditDailyClaim extends EditRecord
{
    protected static string $resource = DailyClaimResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
