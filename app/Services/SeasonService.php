<?php

namespace App\Services;

use App\Models\Season;
use Database\Seeders\SeasonSeeder;

class SeasonService
{
    public function activeSeason(): Season
    {
        $season = Season::query()
            ->where('status', 'active')
            ->latest('starts_at')
            ->first();

        if ($season) {
            return $season;
        }

        (new SeasonSeeder)->run();

        return Season::query()
            ->where('status', 'active')
            ->latest('starts_at')
            ->firstOrFail();
    }
}
