<?php

namespace Database\Factories;

use App\Models\Season;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Season>
 */
class SeasonFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startsAt = now()->subWeeks(2);

        return [
            'code' => 'S'.Str::upper(Str::random(4)),
            'name' => 'Season '.$this->faker->unique()->numberBetween(1, 100),
            'status' => $this->faker->randomElement(['draft', 'active', 'completed', 'archived']),
            'starts_at' => $startsAt,
            'ends_at' => (clone $startsAt)->addMonths(3),
            'total_weeks' => 8,
            'points_budget' => 100000,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (): array => [
            'status' => 'active',
            'starts_at' => now()->subMonth(),
            'ends_at' => now()->addMonths(2),
        ]);
    }
}
