<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\PostView;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PostView>
 */
class PostViewFactory extends Factory
{
    protected $model = PostView::class;

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
