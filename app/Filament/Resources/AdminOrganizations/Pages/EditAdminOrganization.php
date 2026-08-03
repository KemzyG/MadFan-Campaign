<?php

namespace App\Filament\Resources\AdminOrganizations\Pages;

use App\Filament\Resources\AdminOrganizations\AdminOrganizationResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditAdminOrganization extends EditRecord
{
    protected static string $resource = AdminOrganizationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
