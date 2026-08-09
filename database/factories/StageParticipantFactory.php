<?php

namespace Database\Factories;

use App\Enums\StageParticipantRole;
use App\Models\Stage;
use App\Models\StageParticipant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StageParticipant>
 */
class StageParticipantFactory extends Factory
{
    protected $model = StageParticipant::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'stage_id' => Stage::factory(),
            'user_id' => User::factory(),
            'role' => StageParticipantRole::Listener,
            'is_muted' => true,
            'speak_requested_at' => null,
            'joined_at' => now(),
            'left_at' => null,
            'last_seen_at' => now(),
        ];
    }

    public function host(): static
    {
        return $this->state(fn (): array => [
            'role' => StageParticipantRole::Host,
            'is_muted' => false,
        ]);
    }

    public function speaker(): static
    {
        return $this->state(fn (): array => [
            'role' => StageParticipantRole::Speaker,
        ]);
    }

    public function listener(): static
    {
        return $this->state(fn (): array => [
            'role' => StageParticipantRole::Listener,
        ]);
    }
}
