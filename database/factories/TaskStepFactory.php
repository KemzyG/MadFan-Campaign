<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\TaskStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaskStep>
 */
class TaskStepFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'title' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'order' => $this->faker->numberBetween(1, 5),
            'status' => $this->faker->randomElement(['pending', 'active', 'completed']),
        ];
    }

    /**
     * Create a pending step.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Create an active step.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Create a completed step.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
}
