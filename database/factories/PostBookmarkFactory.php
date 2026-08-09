<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\PostBookmark;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PostBookmark>
 */
class PostBookmarkFactory extends Factory
{
    protected $model = PostBookmark::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'post_id' => Post::factory(),
            'user_id' => User::factory(),
            'created_at' => now(),
        ];
    }
}
