<?php

namespace Database\Factories;

use App\Models\Club;
use App\Models\User;
use App\Models\VideoHighlight;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VideoHighlight>
 */
class VideoHighlightFactory extends Factory
{
    protected $model = VideoHighlight::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'author_id' => User::factory(),
            'club_id' => Club::factory(),
            'title' => fake()->sentence(3),
            'caption' => fake()->optional()->sentence(8),
            'video_url' => 'https://assets.mixkit.co/videos/preview/mixkit-soccer-player-dribbling-the-ball-209-large.mp4',
            'thumbnail_url' => null,
            'duration_seconds' => fake()->numberBetween(8, 45),
            'likes_count' => 0,
            'views_count' => 0,
            'is_featured' => false,
            'published_at' => now(),
        ];
    }
}
