<?php

namespace Database\Factories;

use App\Models\PointTransaction;
use App\Models\Season;
use App\Models\SeasonWeek;
use App\Models\User;
use App\Models\WeeklyProgress;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WeeklyProgress>
 */
class WeeklyProgressFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tasksCompleted = $this->faker->numberBetween(0, 10);
        $totalTasks = $this->faker->numberBetween($tasksCompleted, 15);

        return [
            'user_id' => User::factory(),
            'season_id' => Season::factory(),
            'season_week_id' => SeasonWeek::factory(),
            'completion_bonus_transaction_id' => null,
            'tasks_completed' => $tasksCompleted,
            'total_tasks' => $totalTasks,
            'bonus_points_earned' => $tasksCompleted === $totalTasks ? $this->faker->numberBetween(100, 500) : 0,
            'status' => $this->faker->randomElement(['pending', 'in_progress', 'completed']),
        ];
    }

    /**
     * Create a completed week progress.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'tasks_completed' => 10,
            'total_tasks' => 10,
            'bonus_points_earned' => $this->faker->numberBetween(100, 500),
            'completion_bonus_transaction_id' => PointTransaction::factory(),
        ]);
    }

    /**
     * Create a pending week progress.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'tasks_completed' => 0,
            'bonus_points_earned' => 0,
        ]);
    }
}
