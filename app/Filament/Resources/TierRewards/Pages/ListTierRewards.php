<?php

namespace App\Filament\Resources\TierRewards\Pages;

use App\Filament\Resources\TierRewards\TierRewardResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTierRewards extends ListRecords
{
    protected static string $resource = TierRewardResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
