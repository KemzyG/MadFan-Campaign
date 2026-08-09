<?php

namespace Database\Factories;

use App\Models\Stage;
use App\Models\StageMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StageMessage>
 */
class StageMessageFactory extends Factory
{
    protected $model = StageMessage::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'stage_id' => Stage::factory(),
            'user_id' => User::factory(),
            'body' => fake()->sentence(),
        ];
    }
}
