<?php

namespace App\Filament\Resources\MatchFixtures\Pages;

use App\Filament\Resources\MatchFixtures\MatchFixtureResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListMatchFixtures extends ListRecords
{
    protected static string $resource = MatchFixtureResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
