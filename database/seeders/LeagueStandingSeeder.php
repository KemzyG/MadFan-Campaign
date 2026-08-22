<?php

namespace Database\Seeders;

use App\Models\Club;
use App\Models\League;
use App\Models\LeagueStanding;
use Illuminate\Database\Seeder;

class LeagueStandingSeeder extends Seeder
{
    /**
     * Seed league tables for Mad Fan Social clubs (idempotent).
     */
    public function run(): void
    {
        $catalogue = [
            'EPL' => [
                ['short' => 'LIV', 'played' => 24, 'won' => 17, 'drawn' => 5, 'lost' => 2, 'gf' => 52, 'ga' => 21, 'pts' => 56],
                ['short' => 'ARS', 'played' => 24, 'won' => 15, 'drawn' => 7, 'lost' => 2, 'gf' => 48, 'ga' => 19, 'pts' => 52],
                ['short' => 'MCI', 'played' => 24, 'won' => 15, 'drawn' => 5, 'lost' => 4, 'gf' => 47, 'ga' => 24, 'pts' => 50],
                ['short' => 'CHE', 'played' => 24, 'won' => 12, 'drawn' => 7, 'lost' => 5, 'gf' => 41, 'ga' => 28, 'pts' => 43],
                ['short' => 'NEW', 'played' => 24, 'won' => 12, 'drawn' => 5, 'lost' => 7, 'gf' => 38, 'ga' => 29, 'pts' => 41],
                ['short' => 'NFO', 'played' => 24, 'won' => 11, 'drawn' => 6, 'lost' => 7, 'gf' => 34, 'ga' => 27, 'pts' => 39],
                ['short' => 'AVL', 'played' => 24, 'won' => 11, 'drawn' => 5, 'lost' => 8, 'gf' => 36, 'ga' => 32, 'pts' => 38],
                ['short' => 'BHA', 'played' => 24, 'won' => 10, 'drawn' => 7, 'lost' => 7, 'gf' => 35, 'ga' => 31, 'pts' => 37],
                ['short' => 'BOU', 'played' => 24, 'won' => 10, 'drawn' => 6, 'lost' => 8, 'gf' => 33, 'ga' => 34, 'pts' => 36],
                ['short' => 'FUL', 'played' => 24, 'won' => 9, 'drawn' => 7, 'lost' => 8, 'gf' => 31, 'ga' => 30, 'pts' => 34],
                ['short' => 'TOT', 'played' => 24, 'won' => 9, 'drawn' => 5, 'lost' => 10, 'gf' => 37, 'ga' => 35, 'pts' => 32],
                ['short' => 'BRE', 'played' => 24, 'won' => 8, 'drawn' => 7, 'lost' => 9, 'gf' => 32, 'ga' => 36, 'pts' => 31],
                ['short' => 'MUN', 'played' => 24, 'won' => 8, 'drawn' => 6, 'lost' => 10, 'gf' => 29, 'ga' => 33, 'pts' => 30],
                ['short' => 'WHU', 'played' => 24, 'won' => 7, 'drawn' => 8, 'lost' => 9, 'gf' => 28, 'ga' => 35, 'pts' => 29],
                ['short' => 'CRY', 'played' => 24, 'won' => 7, 'drawn' => 7, 'lost' => 10, 'gf' => 27, 'ga' => 34, 'pts' => 28],
                ['short' => 'EVE', 'played' => 24, 'won' => 6, 'drawn' => 9, 'lost' => 9, 'gf' => 26, 'ga' => 32, 'pts' => 27],
                ['short' => 'WOL', 'played' => 24, 'won' => 6, 'drawn' => 5, 'lost' => 13, 'gf' => 24, 'ga' => 38, 'pts' => 23],
                ['short' => 'LEI', 'played' => 24, 'won' => 5, 'drawn' => 6, 'lost' => 13, 'gf' => 25, 'ga' => 41, 'pts' => 21],
                ['short' => 'IPS', 'played' => 24, 'won' => 4, 'drawn' => 7, 'lost' => 13, 'gf' => 22, 'ga' => 44, 'pts' => 19],
                ['short' => 'SOU', 'played' => 24, 'won' => 2, 'drawn' => 5, 'lost' => 17, 'gf' => 18, 'ga' => 49, 'pts' => 11],
            ],
            'LL' => [
                ['short' => 'RMA', 'played' => 22, 'won' => 16, 'drawn' => 4, 'lost' => 2, 'gf' => 44, 'ga' => 16, 'pts' => 52],
                ['short' => 'BAR', 'played' => 22, 'won' => 15, 'drawn' => 4, 'lost' => 3, 'gf' => 49, 'ga' => 22, 'pts' => 49],
                ['short' => 'ATM', 'played' => 22, 'won' => 13, 'drawn' => 5, 'lost' => 4, 'gf' => 36, 'ga' => 20, 'pts' => 44],
                ['short' => 'RSO', 'played' => 22, 'won' => 10, 'drawn' => 6, 'lost' => 6, 'gf' => 30, 'ga' => 24, 'pts' => 36],
                ['short' => 'SEV', 'played' => 22, 'won' => 8, 'drawn' => 7, 'lost' => 7, 'gf' => 28, 'ga' => 27, 'pts' => 31],
            ],
            'SA' => [
                ['short' => 'NAP', 'played' => 22, 'won' => 15, 'drawn' => 4, 'lost' => 3, 'gf' => 40, 'ga' => 18, 'pts' => 49],
                ['short' => 'INT', 'played' => 22, 'won' => 14, 'drawn' => 5, 'lost' => 3, 'gf' => 42, 'ga' => 19, 'pts' => 47],
                ['short' => 'MIL', 'played' => 22, 'won' => 12, 'drawn' => 6, 'lost' => 4, 'gf' => 35, 'ga' => 21, 'pts' => 42],
                ['short' => 'JUV', 'played' => 22, 'won' => 11, 'drawn' => 6, 'lost' => 5, 'gf' => 31, 'ga' => 22, 'pts' => 39],
                ['short' => 'ROM', 'played' => 22, 'won' => 10, 'drawn' => 5, 'lost' => 7, 'gf' => 33, 'ga' => 26, 'pts' => 35],
            ],
        ];

        $seeded = 0;

        foreach ($catalogue as $leagueShort => $rows) {
            $league = League::query()->where('short', $leagueShort)->first();

            if ($league === null) {
                $this->command?->warn("LeagueStandingSeeder skipped {$leagueShort}: league not found.");

                continue;
            }

            foreach ($rows as $row) {
                $club = Club::query()
                    ->where('league_id', $league->id)
                    ->where('short', $row['short'])
                    ->first();

                if ($club === null) {
                    $this->command?->warn("LeagueStandingSeeder skipped {$row['short']}: club not found.");

                    continue;
                }

                LeagueStanding::query()->updateOrCreate(
                    [
                        'league_id' => $league->id,
                        'club_id' => $club->id,
                    ],
                    [
                        'played' => $row['played'],
                        'won' => $row['won'],
                        'drawn' => $row['drawn'],
                        'lost' => $row['lost'],
                        'goals_for' => $row['gf'],
                        'goals_against' => $row['ga'],
                        'points' => $row['pts'],
                    ],
                );

                $seeded++;
            }
        }

        $this->command?->info("League standings ready: {$seeded} rows across ".League::query()->whereHas('standings')->count().' leagues.');
    }
}
