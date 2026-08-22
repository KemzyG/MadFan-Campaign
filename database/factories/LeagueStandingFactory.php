<?php

namespace Database\Factories;

use App\Models\Club;
use App\Models\League;
use App\Models\LeagueStanding;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeagueStanding>
 */
class LeagueStandingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $played = fake()->numberBetween(1, 38);
        $won = fake()->numberBetween(0, $played);
        $remaining = $played - $won;
        $drawn = fake()->numberBetween(0, $remaining);
        $lost = $remaining - $drawn;
        $goalsFor = fake()->numberBetween($won, $won * 4 + $drawn);
        $goalsAgainst = fake()->numberBetween($lost, $lost * 4 + $drawn);

        return [
            'league_id' => League::factory(),
            'club_id' => Club::factory(),
            'played' => $played,
            'won' => $won,
            'drawn' => $drawn,
            'lost' => $lost,
            'goals_for' => $goalsFor,
            'goals_against' => $goalsAgainst,
            'points' => ($won * 3) + $drawn,
        ];
    }
}
