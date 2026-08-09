<?php

namespace Database\Factories;

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\ClubServer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Channel>
 */
class ChannelFactory extends Factory
{
    protected $model = Channel::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'club_server_id' => ClubServer::factory(),
            'slug' => 'general',
            'name' => 'general',
            'type' => ChannelType::Text,
            'topic' => 'Club chatter',
            'position' => 0,
            'slowmode_seconds' => 0,
            'is_read_only' => false,
        ];
    }

    public function general(): static
    {
        return $this->state(fn (array $attributes) => [
            'slug' => 'general',
            'name' => 'general',
            'topic' => 'Everyday terrace talk',
            'position' => 0,
        ]);
    }

    public function matchday(): static
    {
        return $this->state(fn (array $attributes) => [
            'slug' => 'matchday',
            'name' => 'matchday',
            'topic' => 'Live match thread',
            'position' => 1,
        ]);
    }

    public function readOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_read_only' => true,
        ]);
    }
}
