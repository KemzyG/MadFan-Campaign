<?php

use App\Models\MediaAsset;
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
        ->and(MediaAsset::query()->where('cloudinary_public_id', 'madfan/landing/hero')->exists())->toBeTrue();

    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Landing')
            ->where('images.hero.url', asset('landing-media/hero.png'))
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
