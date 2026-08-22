<?php

use App\Models\MediaAsset;
use App\Services\Fan\LandingMediaService;
use App\Support\CloudinaryImageStorage;
use Illuminate\Support\Facades\File;

beforeEach(function () {
    CloudinaryImageStorage::fakeReset();
    File::deleteDirectory(public_path('landing-media'));
});

afterEach(function () {
    CloudinaryImageStorage::fakeReset();
    File::deleteDirectory(public_path('landing-media'));
});

test('landing media urls resolve from public landing-media without database records', function () {
    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => null,
        'cloudinary.api_key' => null,
        'cloudinary.api_secret' => null,
    ]);

    File::ensureDirectoryExists(public_path('landing-media'));
    File::copy(
        resource_path('images/landing/hero.png'),
        public_path('landing-media/hero.png'),
    );

    $service = app(LandingMediaService::class);

    expect($service->urlForKey('hero'))->toBe('/landing-media/hero.png');
});

test('landing media sync publishes images locally when cloudinary is absent', function () {
    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => null,
        'cloudinary.api_key' => null,
        'cloudinary.api_secret' => null,
    ]);

    $this->artisan('madfan:sync-landing-media')
        ->assertSuccessful();

    expect(is_file(public_path('landing-media/hero.png')))->toBeTrue()
        ->and(is_file(public_path('landing-media/hero-phone-feed.png')))->toBeTrue()
        ->and(is_file(public_path('landing-media/hero-phone-passport.png')))->toBeTrue()
        ->and(is_file(public_path('landing-media/hero-phone-chat.png')))->toBeTrue()
        ->and(MediaAsset::query()->where('cloudinary_public_id', 'madfan/landing/hero')->exists())->toBeTrue()
        ->and(MediaAsset::query()->where('cloudinary_public_id', 'madfan/landing/hero-phone-feed')->exists())->toBeTrue();

    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Landing')
            ->where('images.hero.url', '/landing-media/hero.png')
            ->has('images.phones', 3)
            ->where('images.phones.0.stack', 'left')
            ->where('images.phones.1.stack', 'center')
            ->where('images.phones.2.stack', 'right')
            ->where('images.phones.1.url', '/landing-media/hero-phone-feed.png')
            ->has('images.categories.campaign')
            ->has('images.categories.social')
            ->has('images.categories.shop')
            ->has('images.categories.passport'));
});

test('landing media sync uploads to cloudinary with stable public ids when configured', function () {
    CloudinaryImageStorage::fake();

    $this->artisan('madfan:sync-landing-media')
        ->assertSuccessful();

    $hero = MediaAsset::query()->where('cloudinary_public_id', 'madfan/landing/hero')->first();

    expect($hero)->not->toBeNull()
        ->and($hero->path)->toBe('https://res.cloudinary.com/test-cloud/image/upload/v1/madfan/landing/hero.jpg');

    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Landing')
            ->where('images.hero.url', $hero->path));
});

test('landing media sync skips unchanged cloudinary assets on second run', function () {
    CloudinaryImageStorage::fake();

    $this->artisan('madfan:sync-landing-media')->assertSuccessful();
    $firstRunUploads = CloudinaryImageStorage::$uploadLocalPathCallCount;

    $this->artisan('madfan:sync-landing-media')->assertSuccessful();

    expect($firstRunUploads)->toBe(count(config('landing.assets', [])))
        ->and(CloudinaryImageStorage::$uploadLocalPathCallCount)->toBe($firstRunUploads);
});

test('madfan sync media command syncs landing catalog idempotently', function () {
    CloudinaryImageStorage::fake();

    $this->artisan('madfan:sync-media')
        ->assertSuccessful()
        ->expectsOutputToContain('Landing page PNGs');

    expect(MediaAsset::query()->where('cloudinary_public_id', 'madfan/landing/hero')->exists())->toBeTrue();

    $uploadsAfterFirstRun = CloudinaryImageStorage::$uploadLocalPathCallCount;

    $this->artisan('madfan:sync-media')
        ->assertSuccessful()
        ->expectsOutputToContain('skipped');

    expect(CloudinaryImageStorage::$uploadLocalPathCallCount)->toBe($uploadsAfterFirstRun);
});

test('landing media sync fresh flag re-uploads unchanged cloudinary assets', function () {
    CloudinaryImageStorage::fake();

    $this->artisan('madfan:sync-landing-media')->assertSuccessful();
    $uploadsAfterFirstRun = CloudinaryImageStorage::$uploadLocalPathCallCount;

    $this->artisan('madfan:sync-landing-media', ['--fresh' => true])
        ->assertSuccessful();

    expect(CloudinaryImageStorage::$uploadLocalPathCallCount)
        ->toBe($uploadsAfterFirstRun + count(config('landing.assets', [])));
});

test('landing media sync skips unchanged local copies on second run', function () {
    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => null,
        'cloudinary.api_key' => null,
        'cloudinary.api_secret' => null,
    ]);

    $service = app(LandingMediaService::class);

    $first = $service->sync(overwrite: false);
    $second = $service->sync(overwrite: false);

    expect(collect($first)->where('action', 'uploaded')->count())->toBeGreaterThan(0)
        ->and(collect($second)->where('action', 'skipped')->count())->toBe(count(config('landing.assets', [])));
});
