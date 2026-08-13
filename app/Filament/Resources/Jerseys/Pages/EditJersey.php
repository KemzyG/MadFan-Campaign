<?php

namespace App\Filament\Resources\Jerseys\Pages;

use App\Filament\Resources\Jerseys\JerseyResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditJersey extends EditRecord
{
    protected static string $resource = JerseyResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
