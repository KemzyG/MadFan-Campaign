<?php

use App\Models\Club;
use App\Support\CloudinaryImageStorage;
use Database\Seeders\SeasonSeeder;
use Illuminate\Http\UploadedFile;

test('social you requires authentication and onboarding gates', function () {
    $this->get('/social/you')->assertRedirect(route('login'));
});

test('social you page renders the self identity, loyalty and quick-link data', function () {
    $this->seed(SeasonSeeder::class);

    $club = Club::factory()->create(['name' => 'You FC']);
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->get(route('social.you'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/You')
            ->where('identity.name', $user->name)
            ->where('identity.handle', $user->handle)
            ->where('identity.club.name', 'You FC')
            ->has('loyalty.points')
            ->has('records.posts')
            ->has('feed.posts'));
});

test('social you settings update changes name handle and bio', function () {
    $this->seed(SeasonSeeder::class);

    $user = socialReadyUser();

    $this->actingAs($user)
        ->patch('/social/you', [
            'name' => 'Updated Fan',
            'handle' => 'updated-handle',
            'bio' => 'Terrace regular.',
        ])
        ->assertRedirect(route('social.you'));

    $user->refresh();

    expect($user->name)->toBe('Updated Fan')
        ->and($user->handle)->toBe('updated-handle')
        ->and($user->bio)->toBe('Terrace regular.');
});

test('social you settings update rejects a handle already taken by another user', function () {
    $this->seed(SeasonSeeder::class);

    socialReadyUser()->forceFill(['handle' => 'taken-handle'])->save();
    $user = socialReadyUser();

    $this->actingAs($user)
        ->patch('/social/you', ['handle' => 'taken-handle'])
        ->assertSessionHasErrors('handle');

    expect($user->fresh()->handle)->not->toBe('taken-handle');
});

test('social you settings update replaces the avatar image', function () {
    $this->seed(SeasonSeeder::class);

    CloudinaryImageStorage::fake();
    $user = socialReadyUser();

    $this->actingAs($user)
        ->patch('/social/you', [
            'avatar' => UploadedFile::fake()->create('avatar.jpg', 10, 'image/jpeg'),
        ])
        ->assertRedirect(route('social.you'));

    $user->refresh();

    expect($user->avatar_path)->not->toBeNull();

    CloudinaryImageStorage::fakeReset();
});
