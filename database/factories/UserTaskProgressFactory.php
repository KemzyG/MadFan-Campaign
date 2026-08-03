<?php

namespace Database\Factories;

use App\Models\PointTransaction;
use App\Models\Season;
use App\Models\SeasonWeek;
use App\Models\Task;
use App\Models\User;
use App\Models\UserTaskProgress;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserTaskProgress>
 */
class UserTaskProgressFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = $this->faker->randomElement(['not_started', 'in_progress', 'completed', 'verified']);

        return [
            'user_id' => User::factory(),
            'task_id' => Task::factory(),
            'season_id' => Season::factory(),
            'season_week_id' => SeasonWeek::factory(),
            'point_transaction_id' => null,
            'status' => $status,
            'progress_percentage' => $this->getProgressPercentageForStatus($status),
            'completed_at' => $status === 'completed' || $status === 'verified' ? now() : null,
        ];
    }

    /**
     * Create a not started progress.
     */
    public function notStarted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'not_started',
            'progress_percentage' => 0,
            'completed_at' => null,
        ]);
    }

    /**
     * Create an in progress task.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
            'progress_percentage' => $this->faker->numberBetween(1, 99),
            'completed_at' => null,
        ]);
    }

    /**
     * Create a completed task.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'progress_percentage' => 100,
            'completed_at' => now(),
            'point_transaction_id' => PointTransaction::factory(),
        ]);
    }

    /**
     * Create a verified task.
     */
    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'verified',
            'progress_percentage' => 100,
            'completed_at' => now()->subHours(1),
            'point_transaction_id' => PointTransaction::factory(),
        ]);
    }

    /**
     * Get progress percentage based on status.
     */
    private function getProgressPercentageForStatus(string $status): int
    {
        return match ($status) {
            'not_started' => 0,
            'in_progress' => $this->faker->numberBetween(1, 99),
            'completed', 'verified' => 100,
            default => 0,
        };
    }
}
