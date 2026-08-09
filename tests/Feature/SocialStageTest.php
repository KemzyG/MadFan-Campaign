<?php

use App\Enums\StageParticipantRole;
use App\Enums\StageSignalType;
use App\Enums\StageStatus;
use App\Models\Club;
use App\Models\Stage;
use App\Models\StageParticipant;
use App\Models\StageSignal;
use App\Support\ApplicationSettings;

test('social stage requires authentication', function () {
    $this->get('/social/stage')->assertRedirect(route('login'));
});

test('social stage is blocked when the network setting is disabled', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'false']);

    $user = createUser(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->get('/social/stage')
        ->assertRedirect(route('fan.campaign'));
});

test('onboarded fans can list and create a live stage', function () {
    $club = Club::factory()->create(['name' => 'Terrace United']);
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->get('/social/stage')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Stage/Index')
            ->has('stages')
            ->where('max_speakers', 8));

    $this->actingAs($user)
        ->post('/social/stage', ['title' => 'Derby warm-up chat'])
        ->assertRedirect();

    $stage = Stage::query()->first();

    expect($stage)->not->toBeNull()
        ->and($stage->title)->toBe('Derby warm-up chat')
        ->and($stage->status)->toBe(StageStatus::Live)
        ->and($stage->host_id)->toBe($user->id)
        ->and($stage->club_id)->toBe($club->id);

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $user->id)
        ->where('role', StageParticipantRole::Host)
        ->whereNull('left_at')
        ->exists())->toBeTrue();

    $this->actingAs($user)
        ->get("/social/stage/{$stage->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Stage/Show')
            ->where('stage.title', 'Derby warm-up chat')
            ->where('me.role', 'host')
            ->where('voice.mode', 'webrtc_mesh_poll'));
});

test('fans can join leave and chat inside a live stage', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $guest = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'Open mic',
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($guest)
        ->post("/social/stage/{$stage->id}/join")
        ->assertRedirect(route('social.stage.show', $stage));

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $guest->id)
        ->whereNull('left_at')
        ->where('role', StageParticipantRole::Listener)
        ->exists())->toBeTrue();

    $this->actingAs($guest)
        ->post("/social/stage/{$stage->id}/messages", ['body' => 'Floodlights feel loud tonight'])
        ->assertRedirect();

    $this->actingAs($guest)
        ->post("/social/stage/{$stage->id}/speak-request")
        ->assertRedirect();

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/participants/{$guest->id}/promote")
        ->assertRedirect();

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $guest->id)
        ->value('role'))->toBe(StageParticipantRole::Speaker);

    $this->actingAs($guest)
        ->post("/social/stage/{$stage->id}/leave")
        ->assertRedirect(route('social.stage.index'));

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $guest->id)
        ->whereNotNull('left_at')
        ->exists())->toBeTrue();
});

test('only the host can end a stage and start voice', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $guest = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $guest->id,
    ]);

    $this->actingAs($guest)
        ->post("/social/stage/{$stage->id}/voice")
        ->assertForbidden();

    $this->actingAs($guest)
        ->post("/social/stage/{$stage->id}/end")
        ->assertForbidden();

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/voice")
        ->assertRedirect();

    expect($stage->fresh()->voice_enabled)->toBeTrue();

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/end")
        ->assertRedirect(route('social.stage.index'));

    expect($stage->fresh()->status)->toBe(StageStatus::Ended);
});

test('webrtc signal store and drain requires voice enabled participant', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $guest = socialReadyUser($club);

    $stage = Stage::factory()->live()->withVoice()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $guest->id,
    ]);

    $this->actingAs($host)
        ->postJson("/social/stage/{$stage->id}/signals", [
            'to_user_id' => $guest->id,
            'type' => StageSignalType::Offer->value,
            'payload' => ['sdp' => 'v=0', 'type' => 'offer'],
        ])
        ->assertCreated();

    expect(StageSignal::query()->where('stage_id', $stage->id)->count())->toBe(1);

    $this->actingAs($guest)
        ->getJson("/social/stage/{$stage->id}/signals")
        ->assertSuccessful()
        ->assertJsonPath('signals.0.type', 'offer')
        ->assertJsonPath('signals.0.from_user_id', $host->id);

    $this->actingAs($guest)
        ->getJson("/social/stage/{$stage->id}/signals")
        ->assertSuccessful()
        ->assertJsonPath('signals', []);
});

test('speaker promotion respects the eight speaker mesh cap', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    for ($i = 0; $i < 7; $i++) {
        $fan = socialReadyUser($club);
        StageParticipant::factory()->speaker()->create([
            'stage_id' => $stage->id,
            'user_id' => $fan->id,
        ]);
    }

    $overflow = socialReadyUser($club);
    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $overflow->id,
    ]);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/participants/{$overflow->id}/promote")
        ->assertSessionHasErrors('speakers');

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $overflow->id)
        ->value('role'))->toBe(StageParticipantRole::Listener);
});

test('participants can poll stage room json while browsing', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $guest = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'JSON terrace',
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $guest->id,
    ]);

    $this->actingAs($guest)
        ->getJson("/social/stage/{$stage->id}/room")
        ->assertSuccessful()
        ->assertJsonPath('stage.title', 'JSON terrace')
        ->assertJsonPath('me.role', 'listener')
        ->assertJsonPath('voice.mode', 'webrtc_mesh_poll');
});
