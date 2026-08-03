<?php

namespace Database\Factories;

use App\Models\Season;
use App\Models\SeasonWeek;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SeasonWeek>
 */
class SeasonWeekFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-3 months', 'now');
        $endDate = (clone $startDate)->modify('+7 days');

        return [
            'season_id' => Season::factory(),
            'week_number' => $this->faker->numberBetween(1, 13),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => $this->faker->randomElement(['active', 'completed', 'upcoming']),
        ];
    }

    /**
     * Mark the week as active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'start_date' => now()->startOfWeek(),
            'end_date' => now()->endOfWeek(),
        ]);
    }

    /**
     * Mark the week as completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'start_date' => now()->subWeeks(2)->startOfWeek(),
            'end_date' => now()->subWeeks(2)->endOfWeek(),
        ]);
    }
}
