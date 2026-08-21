<?php

use App\Support\CloudinaryImageStorage;
use Database\Seeders\SeasonSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

afterEach(function (): void {
    CloudinaryImageStorage::fakeReset();
});

test('passport avatar upload falls back to local public disk without cloudinary', function () {
    config([
        'cloudinary.cloud_url' => null,
        'cloudinary.cloud_name' => null,
        'cloudinary.api_key' => null,
        'cloudinary.api_secret' => null,
    ]);

    Storage::fake('public');
    ensureRegistrationClub('Arsenal FC');

    $user = createUser(['name' => 'Local Avatar Fan', 'club' => 'Arsenal FC']);
    $this->seed(SeasonSeeder::class);

    $file = UploadedFile::fake()->createWithContent(
        'fan-avatar.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $this->actingAs($user)
        ->post('/passport', [
            '_method' => 'PATCH',
            'name' => 'Local Avatar Fan',
            'handle' => '@localavatar',
            'club' => 'Arsenal FC',
            'avatar' => $file,
        ])
        ->assertRedirect(route('fan.passport'));

    $user->refresh();

    expect($user->avatar_path)->not->toBeNull()
        ->and(CloudinaryImageStorage::isRemoteUrl($user->avatar_path))->toBeFalse()
        ->and($user->avatar_url)->toStartWith('/storage/');

    Storage::disk('public')->assertExists($user->avatar_path);
});

test('passport avatar upload stores a cloudinary url when cloudinary is faked', function () {
    CloudinaryImageStorage::fake();
    ensureRegistrationClub('Arsenal FC');

    $user = createUser(['name' => 'Cdn Avatar Fan', 'club' => 'Arsenal FC']);
    $this->seed(SeasonSeeder::class);

    $file = UploadedFile::fake()->createWithContent(
        'fan-avatar.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $this->actingAs($user)
        ->post('/passport', [
            '_method' => 'PATCH',
            'name' => 'Cdn Avatar Fan',
            'handle' => '@cdnavatar',
            'club' => 'Arsenal FC',
            'avatar' => $file,
        ])
        ->assertRedirect(route('fan.passport'));

    $user->refresh();

    expect($user->avatar_path)->toStartWith('https://res.cloudinary.com/')
        ->and($user->avatar_url)->toStartWith('https://res.cloudinary.com/')
        ->and($user->has_custom_avatar)->toBeTrue();
});

test('social post images use cloudinary when configured', function () {
    CloudinaryImageStorage::fake();

    $user = socialReadyUser();
    $file = UploadedFile::fake()->createWithContent(
        'goal.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $this->actingAs($user)
        ->post('/social/posts', [
            'body' => 'What a strike',
            'images' => [$file],
        ])
        ->assertRedirect();

    $post = $user->posts()->with('media')->latest('id')->first();

    expect($post)->not->toBeNull()
        ->and($post->media)->toHaveCount(1)
        ->and($post->media->first()->path)->toStartWith('https://res.cloudinary.com/')
        ->and($post->media->first()->url)->toStartWith('https://res.cloudinary.com/');
});
