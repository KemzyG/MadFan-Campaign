<?php

namespace Database\Factories;

use App\Models\Season;
use App\Models\SeasonClaimHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SeasonClaimHistory>
 */
class SeasonClaimHistoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $streakDays = $this->faker->numberBetween(0, 90);
        $highestStreak = max($streakDays, $this->faker->numberBetween(0, 90));

        return [
            'user_id' => User::factory(),
            'season_id' => Season::factory(),
            'total_points_claimed' => $this->faker->numberBetween(1000, 50000),
            'total_streak_days' => $streakDays,
            'highest_streak' => $highestStreak,
            'last_claimed_date' => $this->faker->dateTimeBetween('-90 days', 'now')->format('Y-m-d'),
        ];
    }
}
