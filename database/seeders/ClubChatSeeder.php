<?php

namespace Database\Seeders;

use App\Actions\Social\EnsureClubChatRooms;
use App\Models\Club;
use Illuminate\Database\Seeder;

class ClubChatSeeder extends Seeder
{
    /**
     * Ensure every club has a terrace server with #general + #matchday.
     */
    public function run(): void
    {
        $ensure = app(EnsureClubChatRooms::class);

        Club::query()->orderBy('id')->each(function (Club $club) use ($ensure): void {
            $ensure->handle($club);
        });
    }
}
