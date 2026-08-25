<?php

use App\Models\VideoHighlight;
use App\Support\CloudinaryImageStorage;
use Illuminate\Http\UploadedFile;

test('onboarded fans can upload a short reel', function () {
    CloudinaryImageStorage::fake();

    $user = socialReadyUser();
    $video = UploadedFile::fake()->create('terrace.mp4', 2048, 'video/mp4');

    $this->actingAs($user)
        ->post('/social/videos', [
            'video' => $video,
            'title' => 'Late winner',
            'caption' => 'From the Kop end',
            'duration_seconds' => 18,
        ])
        ->assertRedirect(route('social.videos.index'));

    $highlight = VideoHighlight::query()->latest('id')->first();

    expect($highlight)->not->toBeNull()
        ->and($highlight->author_id)->toBe($user->id)
        ->and($highlight->club_id)->toBe($user->favourite_club_id)
        ->and($highlight->title)->toBe('Late winner')
        ->and($highlight->caption)->toBe('From the Kop end')
        ->and($highlight->duration_seconds)->toBe(18)
        ->and($highlight->published_at)->not->toBeNull()
        ->and($highlight->video_url)->toContain('/video/upload/');
});

test('reel upload defaults title when omitted', function () {
    CloudinaryImageStorage::fake();

    $user = socialReadyUser();
    $video = UploadedFile::fake()->create('clip.webm', 1024, 'video/webm');

    $this->actingAs($user)
        ->post('/social/videos', [
            'video' => $video,
            'caption' => 'No title needed',
        ])
        ->assertRedirect(route('social.videos.index'));

    expect(VideoHighlight::query()->latest('id')->first()->title)->toBe('No title needed');
});

test('reel upload requires a video file', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->post('/social/videos', [
            'title' => 'Missing clip',
        ])
        ->assertSessionHasErrors('video');
});

test('reel upload rejects non-video files', function () {
    $user = socialReadyUser();
    $file = UploadedFile::fake()->create('notes.txt', 10, 'text/plain');

    $this->actingAs($user)
        ->post('/social/videos', [
            'video' => $file,
        ])
        ->assertSessionHasErrors('video');
});

test('reel upload rejects overlong declared duration', function () {
    CloudinaryImageStorage::fake();

    $user = socialReadyUser();
    $video = UploadedFile::fake()->create('long.mp4', 1024, 'video/mp4');

    $this->actingAs($user)
        ->post('/social/videos', [
            'video' => $video,
            'duration_seconds' => 200,
        ])
        ->assertSessionHasErrors('duration_seconds');
});

test('videos index exposes upload limits', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->get('/social/videos')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Videos/Index')
            ->has('limits.max_upload_kb')
            ->has('limits.max_duration_seconds'));
});
