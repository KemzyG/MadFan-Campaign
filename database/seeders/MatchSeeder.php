<?php

namespace Database\Seeders;

use App\Enums\MatchStatus;
use App\Models\Club;
use App\Models\MatchFixture;
use Illuminate\Database\Seeder;

class MatchSeeder extends Seeder
{
    /**
     * Seed upcoming fixtures for Social ticketing (idempotent, no factories).
     *
     * Lookup key is home + away + venue so re-runs refresh kickoff/price instead of
     * inserting duplicates when `now()` drifts between deploys.
     */
    public function run(): void
    {
        $pairs = [
            [
                'home' => 'ARS',
                'away' => 'CHE',
                'venue' => 'Emirates Stadium',
                'competition' => 'Premier League',
                'price' => '45.00',
                'days' => 5,
                'hour' => 16,
            ],
            [
                'home' => 'LIV',
                'away' => 'MCI',
                'venue' => 'Anfield',
                'competition' => 'Premier League',
                'price' => '55.00',
                'days' => 8,
                'hour' => 17,
            ],
            [
                'home' => 'MUN',
                'away' => 'TOT',
                'venue' => 'Old Trafford',
                'competition' => 'Premier League',
                'price' => '42.00',
                'days' => 12,
                'hour' => 15,
            ],
            [
                'home' => 'RMA',
                'away' => 'BAR',
                'venue' => 'Santiago Bernabéu',
                'competition' => 'La Liga',
                'price' => '65.00',
                'days' => 14,
                'hour' => 21,
            ],
            [
                'home' => 'JUV',
                'away' => 'MIL',
                'venue' => 'Allianz Stadium',
                'competition' => 'Serie A',
                'price' => '38.00',
                'days' => 18,
                'hour' => 20,
            ],
        ];

        $createdOrUpdated = 0;

        foreach ($pairs as $pair) {
            $home = Club::query()->where('short', $pair['home'])->first();
            $away = Club::query()->where('short', $pair['away'])->first();

            if ($home === null || $away === null) {
                $this->command?->warn("MatchSeeder skipped {$pair['home']} vs {$pair['away']}: missing club.");

                continue;
            }

            MatchFixture::query()->updateOrCreate(
                [
                    'home_club_id' => $home->id,
                    'away_club_id' => $away->id,
                    'venue' => $pair['venue'],
                ],
                [
                    'kickoff_at' => now()->addDays($pair['days'])->setTime($pair['hour'], 0),
                    'status' => MatchStatus::Upcoming,
                    'price' => $pair['price'],
                    'competition' => $pair['competition'],
                ],
            );

            $createdOrUpdated++;
        }

        $upcoming = MatchFixture::query()->upcoming()->count();

        $this->command?->info("Match fixtures ready: {$createdOrUpdated} seeded catalogue, {$upcoming} upcoming purchasable.");
    }
}
