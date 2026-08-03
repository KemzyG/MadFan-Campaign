<?php

namespace Database\Factories;

use App\Enums\TaskAudience;
use App\Models\Season;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'season_id' => Season::factory(),
            'season_week_id' => null,
            'code' => 'TASK_'.Str::upper(Str::random(6)),
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'points' => $this->faker->numberBetween(10, 500),
            'platform' => $this->faker->randomElement(['internal', 'x', 'discord', 'telegram', 'general']),
            'task_type' => 'general',
            'audience' => TaskAudience::Fan->value,
            'staff_position' => null,
            'assigned_user_id' => null,
            'external_url' => null,
            'verification_required' => false,
            'is_active' => true,
            'display_order' => $this->faker->numberBetween(1, 50),
            'starts_at' => null,
            'ends_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (): array => [
            'is_active' => true,
        ]);
    }
}
