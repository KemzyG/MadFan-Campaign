<?php

namespace Database\Factories;

use App\Models\Season;
use App\Models\StreakMilestone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StreakMilestone>
 */
class StreakMilestoneFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $streakNumber = $this->faker->randomElement([7, 14, 21, 30, 45, 60]);

        return [
            'season_id' => Season::factory(),
            'streak_number' => $streakNumber,
            'reward_points' => $streakNumber * 50,
            'reward_description' => $streakNumber.'-day streak reward',
            'status' => $this->faker->randomElement(['active', 'inactive']),
        ];
    }

    /**
     * Create an active milestone.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }
}
