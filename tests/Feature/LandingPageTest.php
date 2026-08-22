<?php

use App\Models\Jersey;
use Database\Seeders\ClubSeeder;
use Database\Seeders\JerseySeeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

test('site landing page is public at root', function () {
    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Landing')
            ->has('featured')
            ->has('images.phones')
            ->has('stats.waitlist_count')
            ->has('story.thesis')
            ->has('story.primitives')
            ->has('story.earn')
            ->has('story.weeks')
            ->has('story.roadmap')
            ->has('story.regions')
            ->has('story.team')
            ->has('story.pages'));
});

test('featured kits fall back to landing media when catalog rows have no product art', function () {
    File::deleteDirectory(public_path('landing-media'));

    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => null,
        'cloudinary.api_key' => null,
        'cloudinary.api_secret' => null,
    ]);

    $this->seed(ClubSeeder::class);
    $this->seed(JerseySeeder::class);

    expect(Jersey::query()->active()->count())->toBeGreaterThan(0);

    $this->artisan('madfan:sync-landing-media')
        ->assertSuccessful();

    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Landing')
            ->has('featured', 3)
            ->where('featured.0.id', 'kit_home')
            ->where('featured.0.image_url', '/landing-media/kit-home.png')
            ->where('featured.1.id', 'kit_away')
            ->where('featured.2.id', 'kit_training')
            ->where('featured.0.slug', fn ($slug) => is_string($slug) && str_ends_with($slug, '-home-2526')));
});

test('featured kits use catalog rows when jerseys have product images', function () {
    Storage::fake('public');
    Storage::disk('public')->put('jerseys/sample-home.png', 'fake-image');

    $this->seed(ClubSeeder::class);
    $this->seed(JerseySeeder::class);

    $jersey = Jersey::query()->active()->latest('id')->firstOrFail();
    $jersey->update(['image' => 'jerseys/sample-home.png']);

    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Landing')
            ->has('featured')
            ->where('featured.0.id', (string) $jersey->id)
            ->where('featured.0.image_url', '/storage/jerseys/sample-home.png'));
});

test('campaign app landing lives at /campaign', function () {
    $this->get('/campaign')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Campaign'));
});

test('company story pages remain public', function () {
    foreach (['/about', '/roadmap', '/region', '/team'] as $path) {
        $this->get($path)->assertSuccessful();
    }
});

test('company story pages render Fan StaticPage or Team components', function () {
    $this->get('/about')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/StaticPage')
            ->where('slug', 'about')
            ->has('sections')
            ->has('title')
            ->has('eyebrow'));

    $this->get('/roadmap')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/StaticPage')
            ->where('slug', 'roadmap')
            ->has('sections'));

    $this->get('/region')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/StaticPage')
            ->where('slug', 'region')
            ->has('sections'));

    $this->get('/team')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Team')
            ->where('slug', 'team')
            ->has('members')
            ->has('open_roles'));
});

test('fan.home and fan.campaign named routes resolve correctly', function () {
    expect(route('fan.home', absolute: false))->toBe('/')
        ->and(route('fan.campaign', absolute: false))->toBe('/campaign');
});
