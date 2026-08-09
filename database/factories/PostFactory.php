<?php

namespace Database\Factories;

use App\Enums\PostType;
use App\Models\Club;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    protected $model = Post::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'author_id' => User::factory(),
            'club_id' => Club::factory(),
            'type' => PostType::Status,
            'body' => fake()->sentence(12),
            'reply_to_id' => null,
            'root_id' => null,
            'quote_of_id' => null,
            'repost_of_id' => null,
            'likes_count' => 0,
            'replies_count' => 0,
            'reposts_count' => 0,
            'quotes_count' => 0,
            'views_count' => 0,
            'is_hidden' => false,
            'published_at' => now(),
        ];
    }

    public function reply(Post $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'reply_to_id' => $parent->id,
            'root_id' => $parent->root_id ?? $parent->id,
            'club_id' => $parent->club_id,
        ]);
    }

    public function hidden(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_hidden' => true,
        ]);
    }
}
