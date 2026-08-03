<?php

namespace Database\Factories;

use App\Models\Streak;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Streak>
 */
class StreakFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $currentStreak = $this->faker->numberBetween(0, 30);
        $longestStreak = max($currentStreak, $this->faker->numberBetween(0, 60));

        return [
            'user_id' => User::factory(),
            'current_streak' => $currentStreak,
            'longest_streak' => $longestStreak,
            'last_claim_date' => $currentStreak > 0 ? now()->toDateString() : now()->subDays(2)->toDateString(),
            'reset_date' => now()->addDays($this->faker->numberBetween(1, 30))->toDateString(),
        ];
    }

    /**
     * Create an active streak.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'current_streak' => $this->faker->numberBetween(5, 30),
            'last_claim_date' => now()->toDateString(),
        ]);
    }

    /**
     * Create a broken streak.
     */
    public function broken(): static
    {
        return $this->state(fn (array $attributes) => [
            'current_streak' => 0,
            'last_claim_date' => now()->subDays(2)->toDateString(),
        ]);
    }
}
