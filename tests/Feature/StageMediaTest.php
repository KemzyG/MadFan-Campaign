<?php

use App\Models\MediaAsset;
use App\Services\Social\StageMediaService;
use App\Support\CloudinaryImageStorage;
use Illuminate\Support\Facades\File;

beforeEach(function () {
    CloudinaryImageStorage::fakeReset();
    File::deleteDirectory(public_path('stage-media'));
});

afterEach(function () {
    CloudinaryImageStorage::fakeReset();
    File::deleteDirectory(public_path('stage-media'));
});

test('stage background urls resolve from public stage-media without database records', function () {
    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => null,
        'cloudinary.api_key' => null,
        'cloudinary.api_secret' => null,
    ]);

    foreach (range(1, 4) as $key) {
        expect(is_file(resource_path('images/stage/stage-bg-'.$key.'.png')))->toBeTrue();
    }

    File::ensureDirectoryExists(public_path('stage-media'));
    File::copy(
        resource_path('images/stage/stage-bg-1.png'),
        public_path('stage-media/stage-bg-1.png'),
    );

    $service = app(StageMediaService::class);

    expect($service->urlForKey(1))->toBe('/stage-media/stage-bg-1.png')
        ->and($service->presentBackgroundOptions())->toHaveCount(4);
});

test('madfan sync media publishes stage backgrounds locally', function () {
    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => null,
        'cloudinary.api_key' => null,
        'cloudinary.api_secret' => null,
    ]);

    $this->artisan('madfan:sync-media')
        ->assertSuccessful();

    expect(is_file(public_path('stage-media/stage-bg-1.png')))->toBeTrue()
        ->and(is_file(public_path('stage-media/stage-bg-2.png')))->toBeTrue()
        ->and(is_file(public_path('stage-media/stage-bg-3.png')))->toBeTrue()
        ->and(is_file(public_path('stage-media/stage-bg-4.png')))->toBeTrue();
});

test('madfan sync media uploads stage backgrounds to cloudinary when configured', function () {
    CloudinaryImageStorage::fake();

    $this->artisan('madfan:sync-media')
        ->assertSuccessful();

    expect(MediaAsset::query()->where('cloudinary_public_id', 'madfan/stage/stage-bg-1')->exists())->toBeTrue();
});
