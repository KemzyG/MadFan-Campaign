<?php

namespace Database\Seeders;

use App\Enums\MatchStatus;
use App\Models\Club;
use App\Models\MatchFixture;
use Illuminate\Database\Seeder;

class MatchSeeder extends Seeder
{
    /**
     * Seed upcoming fixtures for Social ticketing MVP (SQLite-friendly).
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

        foreach ($pairs as $pair) {
            $home = Club::query()->where('short', $pair['home'])->first();
            $away = Club::query()->where('short', $pair['away'])->first();

            if ($home === null || $away === null) {
                continue;
            }

            MatchFixture::query()->updateOrCreate(
                [
                    'home_club_id' => $home->id,
                    'away_club_id' => $away->id,
                    'kickoff_at' => now()->addDays($pair['days'])->setTime($pair['hour'], 0),
                ],
                [
                    'venue' => $pair['venue'],
                    'status' => MatchStatus::Upcoming,
                    'price' => $pair['price'],
                    'competition' => $pair['competition'],
                ],
            );
        }

        $this->command?->info('Match fixtures ready: '.MatchFixture::query()->upcoming()->count().' upcoming.');
    }
}
