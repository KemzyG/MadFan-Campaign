<?php

namespace App\Filament\Resources\AdminOrganizations\Pages;

use App\Filament\Resources\AdminOrganizations\AdminOrganizationResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAdminOrganizations extends ListRecords
{
    protected static string $resource = AdminOrganizationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
