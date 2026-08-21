<?php

namespace Database\Seeders;

use App\Enums\MatchStatus;
use App\Models\Club;
use App\Models\MatchFixture;
use Illuminate\Database\Seeder;

class MatchSeeder extends Seeder
{
    /**
     * Seed fixtures for Social ticketing + fixture board (idempotent, no factories).
     *
     * Lookup key is home + away + venue so re-runs refresh kickoff/price/status
     * instead of inserting duplicates when `now()` drifts between deploys.
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
                'status' => MatchStatus::Upcoming,
            ],
            [
                'home' => 'LIV',
                'away' => 'MCI',
                'venue' => 'Anfield',
                'competition' => 'Premier League',
                'price' => '55.00',
                'days' => 8,
                'hour' => 17,
                'status' => MatchStatus::Upcoming,
            ],
            [
                'home' => 'MUN',
                'away' => 'TOT',
                'venue' => 'Old Trafford',
                'competition' => 'Premier League',
                'price' => '42.00',
                'days' => 12,
                'hour' => 15,
                'status' => MatchStatus::Upcoming,
            ],
            [
                'home' => 'RMA',
                'away' => 'BAR',
                'venue' => 'Santiago Bernabéu',
                'competition' => 'La Liga',
                'price' => '65.00',
                'days' => 14,
                'hour' => 21,
                'status' => MatchStatus::Upcoming,
            ],
            [
                'home' => 'JUV',
                'away' => 'MIL',
                'venue' => 'Allianz Stadium',
                'competition' => 'Serie A',
                'price' => '38.00',
                'days' => 18,
                'hour' => 20,
                'status' => MatchStatus::Upcoming,
            ],
            [
                'home' => 'ARS',
                'away' => 'LIV',
                'venue' => 'Emirates Stadium — Live wire',
                'competition' => 'Premier League',
                'price' => '48.00',
                'days' => 0,
                'hour' => null,
                'minutes_ago' => 35,
                'status' => MatchStatus::Live,
            ],
            [
                'home' => 'CHE',
                'away' => 'TOT',
                'venue' => 'Stamford Bridge',
                'competition' => 'Premier League',
                'price' => '40.00',
                'days' => 0,
                'hour' => 20,
                'status' => MatchStatus::Upcoming,
            ],
            [
                'home' => 'MCI',
                'away' => 'MUN',
                'venue' => 'Etihad Stadium',
                'competition' => 'Premier League',
                'price' => '50.00',
                'days' => -4,
                'hour' => 16,
                'status' => MatchStatus::Finished,
            ],
            [
                'home' => 'BAR',
                'away' => 'RMA',
                'venue' => 'Spotify Camp Nou',
                'competition' => 'La Liga',
                'price' => '70.00',
                'days' => -9,
                'hour' => 21,
                'status' => MatchStatus::Finished,
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

            $kickoff = isset($pair['minutes_ago'])
                ? now()->subMinutes((int) $pair['minutes_ago'])
                : now()->addDays($pair['days'])->setTime((int) $pair['hour'], 0);

            MatchFixture::query()->updateOrCreate(
                [
                    'home_club_id' => $home->id,
                    'away_club_id' => $away->id,
                    'venue' => $pair['venue'],
                ],
                [
                    'kickoff_at' => $kickoff,
                    'status' => $pair['status'],
                    'price' => $pair['price'],
                    'competition' => $pair['competition'],
                ],
            );

            $createdOrUpdated++;
        }

        $upcoming = MatchFixture::query()->upcoming()->count();
        $live = MatchFixture::query()->where('status', MatchStatus::Live)->count();
        $finished = MatchFixture::query()->where('status', MatchStatus::Finished)->count();

        $this->command?->info(
            "Match fixtures ready: {$createdOrUpdated} seeded catalogue, {$upcoming} upcoming, {$live} live, {$finished} finished.",
        );
    }
}
