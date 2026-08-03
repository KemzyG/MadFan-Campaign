<?php

namespace App\Filament\Resources\TierRewards\Pages;

use App\Filament\Resources\TierRewards\TierRewardResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditTierReward extends EditRecord
{
    protected static string $resource = TierRewardResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
