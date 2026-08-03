<?php

namespace App\Filament\Resources\DailyClaims\Pages;

use App\Filament\Resources\DailyClaims\DailyClaimResource;
use Filament\Resources\Pages\CreateRecord;

class CreateDailyClaim extends CreateRecord
{
    protected static string $resource = DailyClaimResource::class;
}
