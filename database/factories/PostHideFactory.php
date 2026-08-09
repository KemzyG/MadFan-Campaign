<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\PostHide;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PostHide>
 */
class PostHideFactory extends Factory
{
    protected $model = PostHide::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'post_id' => Post::factory(),
            'user_id' => User::factory(),
            'reason' => 'not_interested',
            'created_at' => now(),
        ];
    }
}
