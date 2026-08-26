<?php

use App\Enums\StageParticipantRole;
use App\Enums\StageType;
use App\Models\Club;
use App\Models\Stage;
use App\Models\StageParticipant;
use App\Support\StageVoice;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

beforeEach(function () {
    config([
        'livekit.driver' => 'auto',
        'livekit.url' => null,
        'livekit.api_key' => null,
        'livekit.api_secret' => null,
    ]);
});

test('stage voice prefers mesh when livekit credentials are missing', function () {
    expect(StageVoice::credentialsPresent())->toBeFalse()
        ->and(StageVoice::driver())->toBe('mesh');
});

test('stage voice uses livekit when credentials and auto driver are set', function () {
    config([
        'livekit.driver' => 'auto',
        'livekit.url' => 'wss://example.livekit.cloud',
        'livekit.api_key' => 'APItest',
        'livekit.api_secret' => 'livekit-test-secret-at-least-32-bytes!',
    ]);

    expect(StageVoice::driver())->toBe('livekit')
        ->and(StageVoice::roomName(42))->toBe('madfan-stage-42');
});

test('forced livekit without credentials falls back to mesh', function () {
    config([
        'livekit.driver' => 'livekit',
        'livekit.url' => null,
        'livekit.api_key' => null,
        'livekit.api_secret' => null,
    ]);

    expect(StageVoice::driver())->toBe('mesh');
});

test('livekit token endpoint requires voice enabled participant', function () {
    config([
        'livekit.url' => 'wss://example.livekit.cloud',
        'livekit.api_key' => 'APItest',
        'livekit.api_secret' => 'livekit-test-secret-at-least-32-bytes!',
        'livekit.token_ttl' => 600,
    ]);

    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $guest = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'voice_enabled' => false,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($host)
        ->getJson(route('social.stage.livekit-token', $stage))
        ->assertForbidden();

    $stage->update(['voice_enabled' => true]);

    $this->actingAs($guest)
        ->getJson(route('social.stage.livekit-token', $stage))
        ->assertForbidden();

    StageParticipant::factory()->create([
        'stage_id' => $stage->id,
        'user_id' => $guest->id,
        'role' => StageParticipantRole::Listener,
    ]);

    $response = $this->actingAs($guest)
        ->getJson(route('social.stage.livekit-token', $stage))
        ->assertSuccessful()
        ->assertJsonPath('url', 'wss://example.livekit.cloud')
        ->assertJsonPath('room', 'madfan-stage-'.$stage->id)
        ->assertJsonPath('identity', (string) $guest->id)
        ->assertJsonPath('can_publish', false);

    $token = $response->json('token');
    expect($token)->toBeString()->not->toBeEmpty();

    $claims = JWT::decode($token, new Key('livekit-test-secret-at-least-32-bytes!', 'HS256'));
    expect($claims->iss)->toBe('APItest')
        ->and($claims->sub)->toBe((string) $guest->id)
        ->and($claims->video->roomJoin)->toBeTrue()
        ->and($claims->video->canPublish)->toBeFalse()
        ->and($claims->video->canSubscribe)->toBeTrue();
});

test('livekit token grants publish for on-stage speakers', function () {
    config([
        'livekit.url' => 'wss://example.livekit.cloud',
        'livekit.api_key' => 'APItest',
        'livekit.api_secret' => 'livekit-test-secret-at-least-32-bytes!',
    ]);

    $club = Club::factory()->create();
    $host = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'voice_enabled' => true,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($host)
        ->getJson(route('social.stage.livekit-token', $stage))
        ->assertSuccessful()
        ->assertJsonPath('can_publish', true);

    $claims = JWT::decode(
        $this->actingAs($host)->getJson(route('social.stage.livekit-token', $stage))->json('token'),
        new Key('livekit-test-secret-at-least-32-bytes!', 'HS256'),
    );

    expect($claims->video->canPublish)->toBeTrue()
        ->and($claims->video->canPublishSources)->toContain('microphone');
});

test('livekit token endpoint is unavailable without credentials', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'voice_enabled' => true,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($host)
        ->getJson(route('social.stage.livekit-token', $stage))
        ->assertStatus(503);
});

test('publish sources matrix covers every type/host/on-stage combination', function () {
    expect(StageVoice::publishSourcesFor(StageType::Voice, isHost: false, isOnStage: false))->toBe([])
        ->and(StageVoice::publishSourcesFor(StageType::Voice, isHost: true, isOnStage: false))->toBe([])
        ->and(StageVoice::publishSourcesFor(StageType::Voice, isHost: false, isOnStage: true))->toBe(['microphone'])
        ->and(StageVoice::publishSourcesFor(StageType::Voice, isHost: true, isOnStage: true))->toBe(['microphone'])
        ->and(StageVoice::publishSourcesFor(StageType::Video, isHost: false, isOnStage: false))->toBe([])
        ->and(StageVoice::publishSourcesFor(StageType::Video, isHost: false, isOnStage: true))
        ->toBe(['microphone', 'camera', 'screen_share'])
        ->and(StageVoice::publishSourcesFor(StageType::Video, isHost: true, isOnStage: true))
        ->toBe(['microphone', 'camera', 'screen_share'])
        ->and(StageVoice::publishSourcesFor(StageType::Streaming, isHost: false, isOnStage: false))->toBe([])
        ->and(StageVoice::publishSourcesFor(StageType::Streaming, isHost: false, isOnStage: true))->toBe(['microphone'])
        ->and(StageVoice::publishSourcesFor(StageType::Streaming, isHost: true, isOnStage: false))->toBe([])
        ->and(StageVoice::publishSourcesFor(StageType::Streaming, isHost: true, isOnStage: true))
        ->toBe(['microphone', 'camera', 'screen_share']);
});

test('livekit token grants camera and screen share on a video stage but mic only for a streaming speaker', function () {
    config([
        'livekit.url' => 'wss://example.livekit.cloud',
        'livekit.api_key' => 'APItest',
        'livekit.api_secret' => 'livekit-test-secret-at-least-32-bytes!',
    ]);

    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $speaker = socialReadyUser($club);

    $videoStage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => StageType::Video,
        'voice_enabled' => true,
    ]);
    StageParticipant::factory()->host()->create(['stage_id' => $videoStage->id, 'user_id' => $host->id]);
    StageParticipant::factory()->create([
        'stage_id' => $videoStage->id,
        'user_id' => $speaker->id,
        'role' => StageParticipantRole::Speaker,
    ]);

    $this->actingAs($speaker)
        ->getJson(route('social.stage.livekit-token', $videoStage))
        ->assertSuccessful()
        ->assertJsonPath('can_publish', true)
        ->assertJsonPath('can_publish_video', true);

    $streamingStage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => StageType::Streaming,
        'voice_enabled' => true,
    ]);
    StageParticipant::factory()->host()->create(['stage_id' => $streamingStage->id, 'user_id' => $host->id]);
    StageParticipant::factory()->create([
        'stage_id' => $streamingStage->id,
        'user_id' => $speaker->id,
        'role' => StageParticipantRole::Speaker,
    ]);

    $speakerResponse = $this->actingAs($speaker)
        ->getJson(route('social.stage.livekit-token', $streamingStage))
        ->assertSuccessful()
        ->assertJsonPath('can_publish', true)
        ->assertJsonPath('can_publish_video', false);

    $speakerClaims = JWT::decode(
        $speakerResponse->json('token'),
        new Key('livekit-test-secret-at-least-32-bytes!', 'HS256'),
    );
    expect($speakerClaims->video->canPublishSources)->toBe(['microphone']);

    $hostResponse = $this->actingAs($host)
        ->getJson(route('social.stage.livekit-token', $streamingStage))
        ->assertSuccessful()
        ->assertJsonPath('can_publish_video', true);

    $hostClaims = JWT::decode(
        $hostResponse->json('token'),
        new Key('livekit-test-secret-at-least-32-bytes!', 'HS256'),
    );
    expect($hostClaims->video->canPublishSources)->toBe(['microphone', 'camera', 'screen_share']);
});

test('stage room reports livekit voice mode when configured', function () {
    config([
        'livekit.driver' => 'auto',
        'livekit.url' => 'wss://example.livekit.cloud',
        'livekit.api_key' => 'APItest',
        'livekit.api_secret' => 'livekit-test-secret-at-least-32-bytes!',
    ]);

    $club = Club::factory()->create();
    $host = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'voice_enabled' => true,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($host)
        ->getJson("/social/stage/{$stage->id}/room")
        ->assertSuccessful()
        ->assertJsonPath('voice.driver', 'livekit')
        ->assertJsonPath('voice.mode', 'livekit_poll')
        ->assertJsonPath('voice.livekit.url', 'wss://example.livekit.cloud');
});
