<?php

namespace Database\Factories;

use App\Enums\StageSignalType;
use App\Models\Stage;
use App\Models\StageSignal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StageSignal>
 */
class StageSignalFactory extends Factory
{
    protected $model = StageSignal::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'stage_id' => Stage::factory(),
            'from_user_id' => User::factory(),
            'to_user_id' => User::factory(),
            'type' => StageSignalType::Offer,
            'payload' => ['sdp' => 'v=0', 'type' => 'offer'],
            'consumed_at' => null,
        ];
    }
}
