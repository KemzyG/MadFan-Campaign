<?php

use App\Models\Channel;
use App\Models\Club;
use App\Models\Message;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/** A real, authorized club channel for the given user — mirrors SocialPhaseTwoChatTest's setup. */
function attachmentTestChannel($user): Channel
{
    test()->actingAs($user)->get('/social/chat')->assertSuccessful();

    return Channel::query()->where('slug', 'general')->firstOrFail();
}

/**
 * A genuine 1x1 PNG, byte-for-byte — UploadedFile::fake()->image() needs the
 * GD extension (not installed here) to synthesize pixel data; getimagesize()
 * itself doesn't, so a real (if tiny) file exercises the same code path.
 */
function fakePngUpload(string $name = 'photo.png'): UploadedFile
{
    $bytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
    $path = tempnam(sys_get_temp_dir(), 'chat-attachment').'.png';
    file_put_contents($path, $bytes);

    return new UploadedFile($path, $name, 'image/png', null, true);
}

test('a fan can send a photo attachment with no text', function () {
    Storage::fake('public');
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $channel = attachmentTestChannel($user);

    $response = $this->actingAs($user)
        ->postJson(route('api.social.chat.messages.store', $channel), [
            'attachment' => fakePngUpload(),
        ])
        ->assertCreated();

    $response->assertJsonPath('data.media.type', 'image')
        ->assertJsonPath('data.body', null);

    $message = Message::query()->latest('id')->first();
    expect($message->media_path)->not->toBeNull()
        ->and($message->media_type)->toBe('image')
        ->and($message->media_width)->toBe(1)
        ->and($message->media_height)->toBe(1)
        ->and($message->body)->toBeNull();

    Storage::disk('public')->assertExists($message->media_path);
});

test('a fan can send a video attachment alongside text', function () {
    Storage::fake('public');
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $channel = attachmentTestChannel($user);

    $this->actingAs($user)
        ->postJson(route('api.social.chat.messages.store', $channel), [
            'body' => 'watch this',
            'attachment' => UploadedFile::fake()->create('clip.mp4', 500, 'video/mp4'),
        ])
        ->assertCreated()
        ->assertJsonPath('data.media.type', 'video')
        ->assertJsonPath('data.body', 'watch this');

    $message = Message::query()->latest('id')->first();
    expect($message->media_type)->toBe('video')
        ->and($message->type->value)->toBe('attachment');
});

test('sending a message with neither text nor an attachment fails', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $channel = attachmentTestChannel($user);

    $this->actingAs($user)
        ->postJson(route('api.social.chat.messages.store', $channel), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('body');
});

test('an oversized attachment is rejected', function () {
    Storage::fake('public');
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $channel = attachmentTestChannel($user);

    $this->actingAs($user)
        ->postJson(route('api.social.chat.messages.store', $channel), [
            'attachment' => UploadedFile::fake()->create('big.mp4', 40000, 'video/mp4'),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('attachment');
});

test('an unsupported attachment mime type is rejected', function () {
    Storage::fake('public');
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $channel = attachmentTestChannel($user);

    $this->actingAs($user)
        ->postJson(route('api.social.chat.messages.store', $channel), [
            'attachment' => UploadedFile::fake()->create('doc.pdf', 10, 'application/pdf'),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('attachment');
});
