<?php

use App\Models\Fandom;
use App\Models\FandomSubset;

test('fandom discovery page requires authentication', function () {
    $this->get('/social/fandom')->assertRedirect(route('login'));
});

test('fandom discovery page lists groups popular categories and trending', function () {
    $user = socialReadyUser();
    $football = Fandom::query()->where('slug', 'football')->firstOrFail();

    $esports = Fandom::factory()->create(['name' => 'Esports', 'slug' => 'esports', 'group' => 'esports', 'icon' => '🎮']);
    FandomSubset::factory()->for($football)->trending()->create(['name' => 'El Clasico', 'fan_count' => 5000]);
    FandomSubset::factory()->for($esports)->create(['name' => 'League of Legends']);

    // socialReadyUser() already onboards the fan into a follow of Football.

    $this->actingAs($user)
        ->get('/social/fandom')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Fandom/Discover/Discover')
            ->where('active_group', 'all')
            ->has('groups')
            ->has('popular', 2)
            ->has('categories', 2)
            ->has('trending', 1)
            ->where('trending.0.name', 'El Clasico')
            ->where('popular.0.is_following', fn ($value) => is_bool($value)));
});

test('fandom discovery group filter scopes popular and categories', function () {
    $user = socialReadyUser();
    Fandom::factory()->create(['name' => 'Books', 'slug' => 'books', 'group' => 'books']);
    Fandom::factory()->create(['name' => 'Music', 'slug' => 'music', 'group' => 'music']);

    $this->actingAs($user)
        ->get('/social/fandom?group=books')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('active_group', 'books')
            ->has('popular', 1)
            ->where('popular.0.slug', 'books')
            ->has('categories', 1));
});

test('fandom search finds both fandoms and subsets by name', function () {
    $user = socialReadyUser();
    $football = Fandom::query()->where('slug', 'football')->firstOrFail();
    FandomSubset::factory()->for($football)->create(['name' => 'Premier League']);
    Fandom::factory()->create(['name' => 'Premier Esports League', 'slug' => 'premier-esports-league']);

    $response = $this->actingAs($user)
        ->getJson('/api/social/fandom/search?q=Premier')
        ->assertSuccessful();

    expect(collect($response->json('fandoms'))->pluck('name'))->toContain('Premier Esports League')
        ->and(collect($response->json('subsets'))->pluck('name'))->toContain('Premier League');
});

test('an inactive fandom hub 404s', function () {
    $user = socialReadyUser();
    $inactive = Fandom::factory()->create(['slug' => 'retired-fandom', 'is_active' => false]);

    $this->actingAs($user)
        ->get("/social/fandom/{$inactive->slug}")
        ->assertNotFound();
});
