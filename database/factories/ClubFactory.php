<?php

namespace Database\Factories;

use App\Models\Club;
use App\Models\League;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Club>
 */
class ClubFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'league_id' => League::factory(),
            'name' => $this->faker->unique()->company().' FC',
            'short' => strtoupper($this->faker->unique()->lexify('???')),
            'logo' => null,
        ];
    }
}
