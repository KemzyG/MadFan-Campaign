<?php

use App\Models\Post;
use App\Models\User;
use App\Services\Social\FeedService;
use Database\Seeders\ClubSeeder;
use Database\Seeders\SportsPostSeeder;

test('sports post seeder creates twelve professional club briefings under the feed limit', function () {
    $this->seed(ClubSeeder::class);
    $this->seed(SportsPostSeeder::class);

    $posts = Post::query()
        ->whereNull('reply_to_id')
        ->whereHas('author', fn ($query) => $query->where('email', 'like', '%.desk@madfan.test'))
        ->with(['author', 'club'])
        ->get();

    expect($posts)->toHaveCount(12);

    foreach ($posts as $post) {
        expect($post->body)->not->toBeEmpty()
            ->and(mb_strlen((string) $post->body))->toBeLessThanOrEqual(FeedService::MAX_BODY_LENGTH)
            ->and($post->club_id)->toBe($post->author->favourite_club_id)
            ->and($post->author->social_onboarded_at)->not->toBeNull();
    }

    $this->seed(SportsPostSeeder::class);

    expect(
        Post::query()
            ->whereHas('author', fn ($query) => $query->where('email', 'like', '%.desk@madfan.test'))
            ->count()
    )->toBe(12)
        ->and(User::query()->where('email', 'like', '%.desk@madfan.test')->count())->toBe(12);
});
