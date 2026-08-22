<?php

use App\Models\Club;
use App\Models\VideoHighlight;
use App\Support\ApplicationSettings;

test('social videos requires authentication', function () {
    $this->get('/social/videos')->assertRedirect(route('login'));
});

test('onboarded fans can browse video reels', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $highlight = VideoHighlight::factory()->create([
        'author_id' => $user->id,
        'club_id' => $club->id,
        'title' => 'Derby day clip',
        'caption' => 'Terrace angle',
        'published_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/social/videos')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Videos/Index')
            ->has('reels.items', 1)
            ->where('reels.items.0.id', $highlight->id)
            ->where('reels.items.0.title', 'Derby day clip'));
});

test('fans can like and unlike a video highlight', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $highlight = VideoHighlight::factory()->create([
        'author_id' => $user->id,
        'club_id' => $club->id,
        'likes_count' => 0,
        'published_at' => now(),
    ]);

    $this->actingAs($user)
        ->post("/social/videos/{$highlight->id}/like")
        ->assertRedirect();

    expect($highlight->fresh()->likes_count)->toBe(1);

    $this->actingAs($user)
        ->post("/social/videos/{$highlight->id}/like")
        ->assertRedirect();

    expect($highlight->fresh()->likes_count)->toBe(0);
});

test('viewing a reel increments its view count', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $highlight = VideoHighlight::factory()->create([
        'author_id' => $user->id,
        'club_id' => $club->id,
        'views_count' => 3,
        'published_at' => now(),
    ]);

    $this->actingAs($user)
        ->post("/social/videos/{$highlight->id}/view")
        ->assertRedirect();

    expect($highlight->fresh()->views_count)->toBe(4);
});

test('social videos is blocked when the network setting is disabled', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'false']);

    $user = createUser(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->get('/social/videos')
        ->assertRedirect(route('fan.campaign'));
});
