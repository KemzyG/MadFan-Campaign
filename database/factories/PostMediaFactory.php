<?php

namespace Database\Factories;

use App\Enums\MediaType;
use App\Models\Post;
use App\Models\PostMedia;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PostMedia>
 */
class PostMediaFactory extends Factory
{
    protected $model = PostMedia::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'post_id' => Post::factory(),
            'type' => MediaType::Image,
            'path' => 'social/posts/'.fake()->uuid().'.jpg',
            'width' => 1200,
            'height' => 675,
            'sort_order' => 0,
            'created_at' => now(),
        ];
    }
}
