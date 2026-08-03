<?php

namespace Database\Factories;

use App\Models\LeaderboardSnapshot;
use App\Models\Season;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaderboardSnapshot>
 */
class LeaderboardSnapshotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'season_id' => Season::factory(),
            'snapshot_date' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'status' => $this->faker->randomElement(['active', 'archived']),
        ];
    }

    /**
     * Create an active snapshot.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'snapshot_date' => now(),
        ]);
    }

    /**
     * Create an archived snapshot.
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'archived',
            'snapshot_date' => now()->subDays($this->faker->numberBetween(1, 30)),
        ]);
    }
}
