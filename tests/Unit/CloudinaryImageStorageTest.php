<?php

use App\Support\CloudinaryImageStorage;
use App\Support\PublicStorageUrl;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class);

afterEach(function (): void {
    CloudinaryImageStorage::fakeReset();
});

test('it reports not configured when cloudinary env is empty', function () {
    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => null,
        'cloudinary.api_key' => null,
        'cloudinary.api_secret' => null,
    ]);

    expect(CloudinaryImageStorage::configured())->toBeFalse();
});

test('it reports configured when cloudinary credentials are present', function () {
    CloudinaryImageStorage::fake();

    expect(CloudinaryImageStorage::configured())->toBeTrue();
});

function fixtureUpload(string $name = 'crest.jpg'): UploadedFile
{
    return UploadedFile::fake()->createWithContent(
        $name,
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );
}

test('it stores to the public disk when cloudinary is not configured', function () {
    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => null,
        'cloudinary.api_key' => null,
        'cloudinary.api_secret' => null,
    ]);

    Storage::fake('public');

    $path = CloudinaryImageStorage::store(fixtureUpload('crest.jpg'), 'clubs');

    expect($path)->not->toStartWith('http')
        ->and(CloudinaryImageStorage::isRemoteUrl($path))->toBeFalse();

    Storage::disk('public')->assertExists($path);
});

test('it stores a secure cloudinary url when configured via fake', function () {
    CloudinaryImageStorage::fake();

    $path = CloudinaryImageStorage::store(fixtureUpload('avatar.jpg'), 'avatars');

    expect($path)->toStartWith('https://res.cloudinary.com/')
        ->and(CloudinaryImageStorage::isRemoteUrl($path))->toBeTrue()
        ->and(PublicStorageUrl::path($path))->toBe($path);
});

test('it replaces and destroys previous cloudinary assets', function () {
    CloudinaryImageStorage::fake();

    $destroyed = [];
    CloudinaryImageStorage::$destroyUsing = function (string $publicId) use (&$destroyed): void {
        $destroyed[] = $publicId;
    };

    $first = CloudinaryImageStorage::store(fixtureUpload('a.jpg'), 'avatars');
    $second = CloudinaryImageStorage::replace($first, fixtureUpload('b.jpg'), 'avatars');

    expect($second)->not->toBe($first)
        ->and($destroyed)->toHaveCount(1)
        ->and($destroyed[0])->toBe(CloudinaryImageStorage::publicIdFromUrl($first));
});

test('it extracts public ids from cloudinary delivery urls', function () {
    $url = 'https://res.cloudinary.com/demo/image/upload/v1712345678/madfan/avatars/abc123.jpg';

    expect(CloudinaryImageStorage::publicIdFromUrl($url))->toBe('madfan/avatars/abc123');
});

test('default image url builds from cloud name and public id', function () {
    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => 'demo-cloud',
        'cloudinary.default_image' => 'madfan/defaults/thumbnail',
    ]);

    expect(CloudinaryImageStorage::defaultImageUrl())
        ->toBe('https://res.cloudinary.com/demo-cloud/image/upload/madfan/defaults/thumbnail')
        ->and(PublicStorageUrl::defaultImageUrl())
        ->toBe('https://res.cloudinary.com/demo-cloud/image/upload/madfan/defaults/thumbnail');
});

test('default image url accepts a full https url', function () {
    config([
        'cloudinary.cloud_name' => null,
        'cloudinary.cloud_url' => null,
        'cloudinary.default_image' => 'https://res.cloudinary.com/x/image/upload/custom/default.png',
    ]);

    expect(CloudinaryImageStorage::defaultImageUrl())
        ->toBe('https://res.cloudinary.com/x/image/upload/custom/default.png');
});

test('default image url falls back to local asset without cloud name', function () {
    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => null,
        'cloudinary.default_image' => 'madfan/defaults/thumbnail',
        'cloudinary.local_default_image' => 'default-avatar.png',
    ]);

    expect(CloudinaryImageStorage::defaultImageUrl())->toBe('/default-avatar.png');
});

test('public storage url returns default for null or empty paths', function () {
    config([
        'cloudinary.cloud_name' => 'demo-cloud',
        'cloudinary.default_image' => 'madfan/defaults/thumbnail',
    ]);

    $default = 'https://res.cloudinary.com/demo-cloud/image/upload/madfan/defaults/thumbnail';

    expect(PublicStorageUrl::path(null))->toBe($default)
        ->and(PublicStorageUrl::path(''))->toBe($default);
});

test('public storage url passes through absolute remote urls', function () {
    $url = 'https://res.cloudinary.com/demo/image/upload/v1/madfan/posts/x.png';

    expect(PublicStorageUrl::path($url))->toBe($url);
});

test('public storage url keeps existing local files and defaults missing ones', function () {
    config([
        'cloudinary.cloud_name' => 'demo-cloud',
        'cloudinary.default_image' => 'madfan/defaults/thumbnail',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('clubs/logo.png', 'crest');

    expect(PublicStorageUrl::path('clubs/logo.png'))->toBe('/storage/clubs/logo.png')
        ->and(PublicStorageUrl::path('clubs/missing.png'))
        ->toBe('https://res.cloudinary.com/demo-cloud/image/upload/madfan/defaults/thumbnail');
});
