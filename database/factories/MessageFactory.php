<?php

namespace Database\Factories;

use App\Enums\MessageType;
use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    protected $model = Message::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'channel_id' => Channel::factory(),
            'author_id' => User::factory(),
            'type' => MessageType::Text,
            'body' => fake()->sentence(8),
            'reply_to_message_id' => null,
            'edited_at' => null,
        ];
    }
}
