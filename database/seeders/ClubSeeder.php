<?php

namespace Database\Seeders;

use App\Models\Club;
use App\Models\League;
use Illuminate\Database\Seeder;

class ClubSeeder extends Seeder
{
    /**
     * Seed leagues and clubs used by Mad Fan Social onboarding (PickClub).
     */
    public function run(): void
    {
        $catalogue = [
            'EPL' => [
                'name' => 'Premier League',
                'clubs' => [
                    ['name' => 'Arsenal', 'short' => 'ARS'],
                    ['name' => 'Aston Villa', 'short' => 'AVL'],
                    ['name' => 'Bournemouth', 'short' => 'BOU'],
                    ['name' => 'Brentford', 'short' => 'BRE'],
                    ['name' => 'Brighton & Hove Albion', 'short' => 'BHA'],
                    ['name' => 'Chelsea', 'short' => 'CHE'],
                    ['name' => 'Crystal Palace', 'short' => 'CRY'],
                    ['name' => 'Everton', 'short' => 'EVE'],
                    ['name' => 'Fulham', 'short' => 'FUL'],
                    ['name' => 'Ipswich Town', 'short' => 'IPS'],
                    ['name' => 'Leicester City', 'short' => 'LEI'],
                    ['name' => 'Liverpool', 'short' => 'LIV'],
                    ['name' => 'Manchester City', 'short' => 'MCI'],
                    ['name' => 'Manchester United', 'short' => 'MUN'],
                    ['name' => 'Newcastle United', 'short' => 'NEW'],
                    ['name' => 'Nottingham Forest', 'short' => 'NFO'],
                    ['name' => 'Southampton', 'short' => 'SOU'],
                    ['name' => 'Tottenham Hotspur', 'short' => 'TOT'],
                    ['name' => 'West Ham United', 'short' => 'WHU'],
                    ['name' => 'Wolverhampton Wanderers', 'short' => 'WOL'],
                ],
            ],
            'LL' => [
                'name' => 'La Liga',
                'clubs' => [
                    ['name' => 'Real Madrid', 'short' => 'RMA'],
                    ['name' => 'Barcelona', 'short' => 'BAR'],
                    ['name' => 'Atlético Madrid', 'short' => 'ATM'],
                    ['name' => 'Sevilla', 'short' => 'SEV'],
                    ['name' => 'Real Sociedad', 'short' => 'RSO'],
                ],
            ],
            'SA' => [
                'name' => 'Serie A',
                'clubs' => [
                    ['name' => 'Juventus', 'short' => 'JUV'],
                    ['name' => 'AC Milan', 'short' => 'MIL'],
                    ['name' => 'Inter Milan', 'short' => 'INT'],
                    ['name' => 'Napoli', 'short' => 'NAP'],
                    ['name' => 'AS Roma', 'short' => 'ROM'],
                ],
            ],
        ];

        foreach ($catalogue as $short => $leagueData) {
            $league = League::updateOrCreate(
                ['short' => $short],
                [
                    'name' => $leagueData['name'],
                    'logo' => null,
                ],
            );

            foreach ($leagueData['clubs'] as $clubData) {
                Club::updateOrCreate(
                    [
                        'league_id' => $league->id,
                        'short' => $clubData['short'],
                    ],
                    [
                        'name' => $clubData['name'],
                        'logo' => null,
                    ],
                );
            }
        }

        $this->command?->info('Clubs ready: '.Club::query()->count().' clubs across '.League::query()->count().' leagues.');
    }
}
