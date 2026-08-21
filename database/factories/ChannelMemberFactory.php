<?php

namespace Database\Factories;

use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChannelMember>
 */
class ChannelMemberFactory extends Factory
{
    protected $model = ChannelMember::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'channel_id' => Channel::factory(),
            'user_id' => User::factory(),
            'role' => 'member',
            'joined_at' => now(),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (): array => [
            'role' => 'admin',
        ]);
    }
}
