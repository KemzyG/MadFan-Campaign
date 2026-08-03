<?php

namespace Database\Factories;

use App\Models\League;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<League>
 */
class LeagueFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->unique()->words(2, true).' League';

        return [
            'name' => ucwords($name),
            'short' => strtoupper($this->faker->unique()->lexify('???')),
            'logo' => null,
        ];
    }
}
