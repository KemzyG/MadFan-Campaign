<?php

namespace Database\Factories;

use App\Enums\StageStatus;
use App\Models\Club;
use App\Models\Stage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Stage>
 */
class StageFactory extends Factory
{
    protected $model = Stage::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'host_id' => User::factory(),
            'club_id' => Club::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->sentence(12),
            'is_public' => true,
            'allow_invite' => true,
            'allow_chat' => true,
            'allow_speak_requests' => true,
            'background_key' => fake()->numberBetween(1, 4),
            'status' => StageStatus::Live,
            'voice_enabled' => false,
            'started_at' => now(),
            'ended_at' => null,
        ];
    }

    public function live(): static
    {
        return $this->state(fn (): array => [
            'status' => StageStatus::Live,
            'ended_at' => null,
            'started_at' => now(),
        ]);
    }

    public function ended(): static
    {
        return $this->state(fn (): array => [
            'status' => StageStatus::Ended,
            'voice_enabled' => false,
            'ended_at' => now(),
        ]);
    }

    public function withVoice(): static
    {
        return $this->state(fn (): array => [
            'voice_enabled' => true,
        ]);
    }

    public function private(): static
    {
        return $this->state(fn (): array => [
            'is_public' => false,
        ]);
    }

    public function withoutChat(): static
    {
        return $this->state(fn (): array => [
            'allow_chat' => false,
        ]);
    }

    public function withoutInvites(): static
    {
        return $this->state(fn (): array => [
            'allow_invite' => false,
        ]);
    }
}
