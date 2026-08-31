<?php

use App\Enums\StageParticipantRole;
use App\Enums\StageSignalType;
use App\Enums\StageStatus;
use App\Events\Social\StageSignalCreated;
use App\Models\Club;
use App\Models\Post;
use App\Models\Stage;
use App\Models\StageMessage;
use App\Models\StageParticipant;
use App\Models\StageSignal;
use App\Support\ApplicationSettings;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;

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
        ->post('/social/stage', [
            'title' => 'Derby warm-up chat',
            'description' => 'Pre-match terrace vibes',
            'is_public' => true,
            'allow_invite' => true,
            'allow_chat' => true,
            'allow_speak_requests' => true,
            'background_key' => 2,
        ])
        ->assertRedirect();

    $stage = Stage::query()->first();

    expect($stage)->not->toBeNull()
        ->and($stage->title)->toBe('Derby warm-up chat')
        ->and($stage->description)->toBe('Pre-match terrace vibes')
        ->and($stage->is_public)->toBeTrue()
        ->and($stage->allow_chat)->toBeTrue()
        ->and($stage->background_key)->toBe(2)
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
            ->where('stage.description', 'Pre-match terrace vibes')
            ->where('stage.background_key', 2)
            ->has('stage.background_url')
            ->where('me.role', 'host')
            ->where('voice.mode', 'webrtc_mesh_poll')
            ->where('voice.driver', 'mesh'));
});

test('a host can choose how many seats the stage starts with', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->post('/social/stage', [
            'title' => 'Five-seat panel',
            'max_speakers' => 5,
        ])
        ->assertRedirect();

    $stage = Stage::query()->where('title', 'Five-seat panel')->firstOrFail();

    expect($stage->max_speakers)->toBe(5);

    $this->actingAs($user)
        ->get("/social/stage/{$stage->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('stage.max_speakers', 5)
            ->where('voice.max_speakers', 5));
});

test('seat count is rejected outside the offered options', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->post('/social/stage', [
            'title' => 'Odd seat count',
            'max_speakers' => 3,
        ])
        ->assertSessionHasErrors('max_speakers');

    expect(Stage::query()->where('title', 'Odd seat count')->exists())->toBeFalse();

    $this->actingAs($user)
        ->post('/social/stage', [
            'title' => 'Too many seats',
            'max_speakers' => 13,
        ])
        ->assertSessionHasErrors('max_speakers');

    expect(Stage::query()->where('title', 'Too many seats')->exists())->toBeFalse();
});

test('twelve seats is the top of the offered range', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->post('/social/stage', [
            'title' => 'Full panel',
            'max_speakers' => 12,
        ])
        ->assertRedirect();

    expect(Stage::query()->where('title', 'Full panel')->firstOrFail()->max_speakers)->toBe(12);
});

test('creating a stage defaults to voice type with the media session off', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->post('/social/stage', ['title' => 'Classic terrace chat'])
        ->assertRedirect();

    $stage = Stage::query()->first();

    expect($stage->type)->toBe(App\Enums\StageType::Voice)
        ->and($stage->voice_enabled)->toBeFalse();
});

test('a video or streaming stage starts with its media session already on', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)->post('/social/stage', [
        'title' => 'Match day co-stream',
        'type' => 'video',
    ])->assertRedirect();

    $video = Stage::query()->where('title', 'Match day co-stream')->firstOrFail();
    expect($video->type)->toBe(App\Enums\StageType::Video)
        ->and($video->voice_enabled)->toBeTrue();

    $this->actingAs($user)->post('/social/stage', [
        'title' => 'Solo broadcast',
        'type' => 'streaming',
    ])->assertRedirect();

    $streaming = Stage::query()->where('title', 'Solo broadcast')->firstOrFail();
    expect($streaming->type)->toBe(App\Enums\StageType::Streaming)
        ->and($streaming->voice_enabled)->toBeTrue();
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

test('fans from another club can list a live stage hosted under a rival club', function () {
    $hostClub = Club::factory()->create(['name' => 'Home Side']);
    $visitorClub = Club::factory()->create(['name' => 'Away Side']);
    $host = socialReadyUser($hostClub);
    $visitor = socialReadyUser($visitorClub);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $hostClub->id,
        'title' => 'Cross-terrace open mic',
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($visitor)
        ->get('/social/stage')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Stage/Index')
            ->has('stages', 1)
            ->where('stages.0.id', $stage->id)
            ->where('stages.0.title', 'Cross-terrace open mic'));
});

test('fans from another club can join a live stage as listeners', function () {
    $hostClub = Club::factory()->create(['name' => 'Home Side']);
    $visitorClub = Club::factory()->create(['name' => 'Away Side']);
    $host = socialReadyUser($hostClub);
    $visitor = socialReadyUser($visitorClub);

    expect($visitor->favourite_club_id)->not->toBe($hostClub->id);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $hostClub->id,
        'title' => 'Everyone welcome',
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($visitor)
        ->post("/social/stage/{$stage->id}/join")
        ->assertRedirect(route('social.stage.show', $stage));

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $visitor->id)
        ->whereNull('left_at')
        ->where('role', StageParticipantRole::Listener)
        ->exists())->toBeTrue();

    $this->actingAs($visitor)
        ->get("/social/stage/{$stage->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Stage/Show')
            ->where('stage.title', 'Everyone welcome')
            ->where('me.role', 'listener'));
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

test('a webrtc signal broadcasts on a per-recipient channel, not the shared room channel', function () {
    Event::fake([StageSignalCreated::class]);

    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $guest = socialReadyUser($club);

    $stage = Stage::factory()->live()->withVoice()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
    ]);

    StageParticipant::factory()->host()->create(['stage_id' => $stage->id, 'user_id' => $host->id]);
    StageParticipant::factory()->listener()->create(['stage_id' => $stage->id, 'user_id' => $guest->id]);

    $this->actingAs($host)
        ->postJson("/social/stage/{$stage->id}/signals", [
            'to_user_id' => $guest->id,
            'type' => StageSignalType::Offer->value,
            'payload' => ['sdp' => 'v=0', 'type' => 'offer'],
        ])
        ->assertCreated();

    Event::assertDispatched(StageSignalCreated::class, function (StageSignalCreated $event) use ($stage, $guest) {
        $channelNames = collect($event->broadcastOn())->map(fn ($channel) => $channel->name);

        return $channelNames->contains("private-social.stage.{$stage->id}.user.{$guest->id}")
            && ! $channelNames->contains("private-social.stage.{$stage->id}");
    });
});

test('webrtc signal payload preserves trailing sdp crlf for setRemoteDescription', function () {
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

    // Last line mirrors the Chrome console failure: a=ssrc… msid:stream track
    $sdp = "v=0\r\n"
        ."o=- 0 0 IN IP4 127.0.0.1\r\n"
        ."s=-\r\n"
        ."t=0 0\r\n"
        .'a=ssrc:2575601734 msid:bca6c5ea-54c5-4fee-9ee1-17d5fd50214f 7b7902ef-dda8-4226-b1c0-eb09cb7db746'
        ."\r\n";

    $this->actingAs($host)
        ->postJson("/social/stage/{$stage->id}/signals", [
            'to_user_id' => $guest->id,
            'type' => StageSignalType::Offer->value,
            'payload' => ['sdp' => $sdp, 'type' => 'offer'],
        ])
        ->assertCreated();

    $stored = StageSignal::query()->where('stage_id', $stage->id)->first();

    expect($stored)->not->toBeNull()
        ->and($stored->payload['sdp'])->toBe($sdp)
        ->and(str_ends_with($stored->payload['sdp'], "\r\n"))->toBeTrue();

    $this->actingAs($guest)
        ->getJson("/social/stage/{$stage->id}/signals")
        ->assertSuccessful()
        ->assertJsonPath('signals.0.payload.sdp', $sdp);
});

test('webrtc answer signal payload round-trips for mesh signaling', function () {
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

    $sdp = "v=0\r\n"
        ."o=- 0 0 IN IP4 127.0.0.1\r\n"
        ."s=-\r\n"
        ."t=0 0\r\n"
        ."m=audio 9 UDP/TLS/RTP/SAVPF 111\r\n"
        ."a=rtpmap:111 opus/48000/2\r\n"
        ."\r\n";

    $this->actingAs($guest)
        ->postJson("/social/stage/{$stage->id}/signals", [
            'to_user_id' => $host->id,
            'type' => StageSignalType::Answer->value,
            'payload' => ['sdp' => $sdp, 'type' => 'answer'],
        ])
        ->assertCreated();

    $this->actingAs($host)
        ->getJson("/social/stage/{$stage->id}/signals")
        ->assertSuccessful()
        ->assertJsonPath('signals.0.type', 'answer')
        ->assertJsonPath('signals.0.from_user_id', $guest->id)
        ->assertJsonPath('signals.0.payload.sdp', $sdp);
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
        ->assertJsonPath('voice.mode', 'webrtc_mesh_poll')
        ->assertJsonPath('voice.has_turn', true)
        ->assertJsonStructure([
            'voice' => [
                'ice_servers' => [
                    ['urls'],
                ],
            ],
        ]);

    $iceServers = $this->actingAs($guest)
        ->getJson("/social/stage/{$stage->id}/room")
        ->json('voice.ice_servers');

    expect($iceServers)->toBeArray()->not->toBeEmpty();
    expect(collect($iceServers)->contains(fn ($server) => isset($server['username'])))->toBeTrue();
});

test('custom RTC_TURN env overrides public openrelay ice servers', function () {
    config([
        'webrtc.stun_urls' => ['stun:stun.l.google.com:19302'],
        'webrtc.turn_urls' => ['turn:turn.example.test:3478'],
        'webrtc.turn_username' => 'madfan-turn',
        'webrtc.turn_credential' => 'secret-turn',
        'webrtc.use_public_turn_fallback' => true,
    ]);

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

    $this->actingAs($host)
        ->getJson("/social/stage/{$stage->id}/room")
        ->assertSuccessful()
        ->assertJsonPath('voice.has_turn', true)
        ->assertJsonPath('voice.ice_servers.1.urls.0', 'turn:turn.example.test:3478')
        ->assertJsonPath('voice.ice_servers.1.username', 'madfan-turn');
});

test('stage room and signal polls use separate rate limit buckets', function () {
    RateLimiter::for('stage-room', fn ($request) => Limit::perMinute(3)->by(
        'stage-room-test|'.($request->user()?->id ?: $request->ip()),
    ));
    RateLimiter::for('stage-signal-poll', fn ($request) => Limit::perMinute(3)->by(
        'stage-signal-poll-test|'.($request->user()?->id ?: $request->ip()),
    ));

    try {
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

        foreach (range(1, 3) as $_) {
            $this->actingAs($guest)
                ->getJson("/social/stage/{$stage->id}/room")
                ->assertSuccessful();
        }

        $this->actingAs($guest)
            ->getJson("/social/stage/{$stage->id}/room")
            ->assertStatus(429);

        // Dedicated signal-poll bucket must remain available after room-poll exhaustion.
        $this->actingAs($guest)
            ->getJson("/social/stage/{$stage->id}/signals")
            ->assertSuccessful();
    } finally {
        RateLimiter::for('stage-room', fn ($request) => Limit::perMinute(240)->by(
            'stage-room|'.($request->user()?->id ?: $request->ip()),
        ));
        RateLimiter::for('stage-signal-poll', fn ($request) => Limit::perMinute(240)->by(
            'stage-signal-poll|'.($request->user()?->id ?: $request->ip()),
        ));
    }
});

test('stage signal posts accept ice bursts and batched candidates', function () {
    RateLimiter::for('stage-signal-post', fn ($request) => Limit::perMinute(50)->by(
        'stage-signal-post-test|'.($request->user()?->id ?: $request->ip()),
    ));

    try {
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

        foreach (range(1, 25) as $i) {
            $this->actingAs($host)
                ->postJson("/social/stage/{$stage->id}/signals", [
                    'to_user_id' => $guest->id,
                    'type' => StageSignalType::Ice->value,
                    'payload' => [
                        'candidate' => [
                            'candidate' => "candidate:{$i} 1 udp 2122260223 10.0.0.1 54000 typ host",
                            'sdpMid' => '0',
                            'sdpMLineIndex' => 0,
                        ],
                    ],
                ])
                ->assertCreated();
        }

        $this->actingAs($host)
            ->postJson("/social/stage/{$stage->id}/signals", [
                'to_user_id' => $guest->id,
                'type' => StageSignalType::Ice->value,
                'payload' => [
                    'candidates' => [
                        [
                            'candidate' => 'candidate:batch-a 1 udp 2122260223 10.0.0.2 54001 typ host',
                            'sdpMid' => '0',
                            'sdpMLineIndex' => 0,
                        ],
                        [
                            'candidate' => 'candidate:batch-b 1 udp 2122260223 10.0.0.2 54002 typ host',
                            'sdpMid' => '0',
                            'sdpMLineIndex' => 0,
                        ],
                    ],
                ],
            ])
            ->assertCreated();

        expect(StageSignal::query()->where('stage_id', $stage->id)->count())->toBe(26);
    } finally {
        RateLimiter::for('stage-signal-post', fn ($request) => Limit::perMinute(600)->by(
            'stage-signal-post|'.($request->user()?->id ?: $request->ip()),
        ));
    }
});

test('stage index excludes ended stages and rooms without active participants', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);

    $live = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'Active terrace',
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $live->id,
        'user_id' => $host->id,
    ]);

    Stage::factory()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'Ghost room',
        'status' => StageStatus::Ended,
        'ended_at' => now(),
    ]);

    $this->actingAs($host)
        ->get('/social/stage')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('stages', 1)
            ->where('stages.0.id', $live->id));

    StageParticipant::query()
        ->where('stage_id', $live->id)
        ->update(['left_at' => now()]);

    $this->actingAs($host)
        ->get('/social/stage')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->has('stages', 0));
});

test('stage message store succeeds when reverb is unavailable', function () {
    $previousBroadcasting = config('broadcasting');

    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
        'broadcasting.connections.reverb.secret' => 'secret',
        'broadcasting.connections.reverb.app_id' => '1',
        'broadcasting.connections.reverb.options' => [
            'host' => 'localhost',
            'port' => 8080,
            'scheme' => 'http',
        ],
    ]);

    try {
        $club = Club::factory()->create();
        $host = socialReadyUser($club);
        $guest = socialReadyUser($club);

        $stage = Stage::factory()->live()->create([
            'host_id' => $host->id,
            'club_id' => $club->id,
            'title' => 'Reverb down room',
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
            ->post("/social/stage/{$stage->id}/messages", ['body' => 'Still lands when Reverb is down'])
            ->assertRedirect();

        expect(StageMessage::query()
            ->where('stage_id', $stage->id)
            ->value('body'))->toBe('Still lands when Reverb is down');
    } finally {
        config(['broadcasting' => $previousBroadcasting]);
    }
});

test('host can ban transfer host mute speakers and share a live stage', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $guest = socialReadyUser($club);
    $speaker = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'Host tools test',
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $guest->id,
    ]);

    StageParticipant::factory()->speaker()->create([
        'stage_id' => $stage->id,
        'user_id' => $speaker->id,
        'is_muted' => false,
    ]);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/participants/{$speaker->id}/host-mute", ['muted' => 1])
        ->assertRedirect();

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $speaker->id)
        ->value('is_muted'))->toBeTrue();

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/transfer-host", ['user_id' => $guest->id])
        ->assertRedirect();

    expect($stage->fresh()->host_id)->toBe($guest->id);
    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $guest->id)
        ->value('role'))->toBe(StageParticipantRole::Host);

    $this->actingAs($guest)
        ->post("/social/stage/{$stage->id}/participants/{$host->id}/ban")
        ->assertRedirect();

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $host->id)
        ->whereNotNull('banned_at')
        ->exists())->toBeTrue();

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/join")
        ->assertSessionHasErrors('stage');

    $this->actingAs($guest)
        ->post("/social/stage/{$stage->id}/share")
        ->assertRedirect();

    expect(Post::query()->where('author_id', $guest->id)->exists())->toBeTrue();
});

test('private stages are hidden from the public lobby', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $visitor = socialReadyUser($club);

    $public = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'Public terrace',
        'is_public' => true,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $public->id,
        'user_id' => $host->id,
    ]);

    $private = Stage::factory()->live()->private()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'Private huddle',
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $private->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($visitor)
        ->get('/social/stage')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('stages', 1)
            ->where('stages.0.id', $public->id)
            ->where('stages.0.title', 'Public terrace'));

    $this->actingAs($visitor)
        ->get("/social/stage/{$private->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('stage.title', 'Private huddle')
            ->where('stage.is_public', false));
});

test('stage chat is blocked when allow chat is disabled', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $guest = socialReadyUser($club);

    $stage = Stage::factory()->live()->withoutChat()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'Voice only room',
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
        ->post("/social/stage/{$stage->id}/messages", ['body' => 'Should not land'])
        ->assertForbidden();

    expect(StageMessage::query()->where('stage_id', $stage->id)->exists())->toBeFalse();
});

test('stage speak requests are blocked when disabled', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $guest = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'allow_speak_requests' => false,
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
        ->post("/social/stage/{$stage->id}/speak-request")
        ->assertSessionHasErrors('speak');
});

test('stage share is blocked when invites are disabled', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);

    $stage = Stage::factory()->live()->withoutInvites()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/share")
        ->assertForbidden();
});
