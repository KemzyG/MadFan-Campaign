<?php

use App\Enums\MediaType;
use App\Models\Post;
use App\Models\PostMedia;
use App\Support\CloudinaryImageStorage;
use Illuminate\Http\UploadedFile;

test('fans can attach a video to a social post', function () {
    CloudinaryImageStorage::fake();

    $user = socialReadyUser();
    $video = UploadedFile::fake()->create('clip.mp4', 1024, 'video/mp4');

    $this->actingAs($user)
        ->post('/social/posts', [
            'body' => 'Terrace clip',
            'images' => [$video],
        ])
        ->assertRedirect(route('social.feed'));

    $post = $user->posts()->with('media')->latest('id')->first();

    expect($post)->not->toBeNull()
        ->and($post->media)->toHaveCount(1)
        ->and($post->media->first()->type)->toBe(MediaType::Video)
        ->and($post->media->first()->path)->toContain('/video/upload/');
});

test('fans can mix images and videos on a post', function () {
    CloudinaryImageStorage::fake();

    $user = socialReadyUser();
    $image = UploadedFile::fake()->createWithContent(
        'goal.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );
    $video = UploadedFile::fake()->create('clip.webm', 800, 'video/webm');

    $this->actingAs($user)
        ->post('/social/posts', [
            'body' => 'Mixed media',
            'images' => [$image, $video],
        ])
        ->assertRedirect(route('social.feed'));

    $post = $user->posts()->with('media')->latest('id')->first();

    expect($post->media)->toHaveCount(2)
        ->and($post->media->pluck('type')->all())->toContain(MediaType::Image, MediaType::Video);
});

test('feed presentation includes media type for videos', function () {
    $user = socialReadyUser();
    $post = Post::factory()->create([
        'author_id' => $user->id,
        'club_id' => $user->favourite_club_id,
        'published_at' => now(),
    ]);

    PostMedia::factory()->create([
        'post_id' => $post->id,
        'type' => MediaType::Video,
        'path' => 'https://res.cloudinary.com/demo/video/upload/v1/demo.mp4',
    ]);

    $this->actingAs($user)
        ->get('/social/feed')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('feed.posts', 1)
            ->where('feed.posts.0.media.0.type', 'video'));
});

test('post video rejects unsupported mime types', function () {
    $user = socialReadyUser();
    $file = UploadedFile::fake()->create('clip.mov', 500, 'video/quicktime');

    $this->actingAs($user)
        ->post('/social/posts', [
            'body' => 'Nope',
            'images' => [$file],
        ])
        ->assertSessionHasErrors('images.0');
});
