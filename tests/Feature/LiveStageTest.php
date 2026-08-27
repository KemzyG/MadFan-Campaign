<?php

use App\Enums\LiveStageStatus;
use App\Enums\LiveStageType;
use App\Models\Club;
use App\Models\LiveStage;
use App\Models\LiveStageComment;
use App\Models\LiveStageViewerSession;

test('social live requires authentication', function () {
    $this->get('/social/live')->assertRedirect(route('login'));
});

test('onboarded fans can list and create a live stage', function () {
    $club = Club::factory()->create(['name' => 'Terrace United']);
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->get('/social/live')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Live/Index')
            ->has('stages')
            ->has('stage_types'));

    $this->actingAs($user)
        ->post('/social/live', [
            'title' => 'Matchday chat with the gaffer',
            'type' => 'creator',
            'description' => 'Pre-match thoughts',
            'is_public' => true,
        ])
        ->assertRedirect();

    $stage = LiveStage::query()->first();

    expect($stage)->not->toBeNull()
        ->and($stage->title)->toBe('Matchday chat with the gaffer')
        ->and($stage->type)->toBe(LiveStageType::Creator)
        ->and($stage->status)->toBe(LiveStageStatus::Draft)
        ->and($stage->host_id)->toBe($user->id)
        ->and($stage->club_id)->toBe($club->id)
        ->and($stage->started_at)->toBeNull();
});

test('only implemented stage types can be created', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->post('/social/live', ['title' => 'A gaming stream', 'type' => 'gaming'])
        ->assertSessionHasErrors('type');

    expect(LiveStage::query()->count())->toBe(0);
});

test('a stage stays draft until the host explicitly starts it', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);

    $stage = LiveStage::query()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => LiveStageType::Creator,
        'title' => 'Pre-live check',
        'status' => LiveStageStatus::Draft,
    ]);

    $this->actingAs($host)
        ->get("/social/live/{$stage->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('stage.status', 'draft')
            ->where('stage.is_live', false)
            ->where('stage.is_host', true));

    $this->actingAs($host)
        ->post("/social/live/{$stage->id}/start")
        ->assertRedirect();

    $stage = $stage->fresh();
    expect($stage->status)->toBe(LiveStageStatus::Live)
        ->and($stage->started_at)->not->toBeNull()
        ->and($stage->stream_room_id)->toBe("madfan-live-{$stage->id}");
});

test('only the host can start or end a stage', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $stranger = socialReadyUser($club);

    $stage = LiveStage::query()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => LiveStageType::Creator,
        'title' => 'Host-only actions',
        'status' => LiveStageStatus::Draft,
    ]);

    $this->actingAs($stranger)
        ->post("/social/live/{$stage->id}/start")
        ->assertForbidden();

    $this->actingAs($host)->post("/social/live/{$stage->id}/start");

    $this->actingAs($stranger)
        ->post("/social/live/{$stage->id}/end")
        ->assertForbidden();

    expect($stage->fresh()->status)->toBe(LiveStageStatus::Live);
});

test('fans can join a live stage, comment, and react', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $stage = LiveStage::query()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => LiveStageType::Creator,
        'title' => 'Open stream',
        'status' => LiveStageStatus::Live,
        'started_at' => now(),
        'settings' => ['allow_comments' => true, 'allow_reactions' => true],
    ]);

    $this->actingAs($viewer)
        ->get("/social/live/{$stage->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('stage.is_host', false)
            ->where('stage.viewer_count', 1));

    expect(LiveStageViewerSession::query()
        ->where('live_stage_id', $stage->id)
        ->where('user_id', $viewer->id)
        ->whereNull('left_at')
        ->exists())->toBeTrue();

    $this->actingAs($viewer)
        ->post("/social/live/{$stage->id}/comments", ['body' => 'Great stream!'])
        ->assertRedirect();

    expect(LiveStageComment::query()
        ->where('live_stage_id', $stage->id)
        ->where('body', 'Great stream!')
        ->exists())->toBeTrue();

    $this->actingAs($viewer)
        ->post("/social/live/{$stage->id}/reactions", ['emoji' => '🔥'])
        ->assertRedirect();

    expect(\App\Models\LiveStageReactionTotal::query()
        ->where('live_stage_id', $stage->id)
        ->where('emoji', '🔥')
        ->value('total'))->toBe(1);
});

test('a viewer cannot comment on a stage with comments disabled', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $stage = LiveStage::query()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => LiveStageType::Creator,
        'title' => 'Quiet stream',
        'status' => LiveStageStatus::Live,
        'started_at' => now(),
        'settings' => ['allow_comments' => false, 'allow_reactions' => true],
    ]);

    $this->actingAs($viewer)->get("/social/live/{$stage->id}");

    $this->actingAs($viewer)
        ->post("/social/live/{$stage->id}/comments", ['body' => 'Anyone home?'])
        ->assertForbidden();
});

test('an arbitrary user cannot comment without ever joining the stage', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $bystander = socialReadyUser($club);

    $stage = LiveStage::query()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => LiveStageType::Creator,
        'title' => 'Never joined',
        'status' => LiveStageStatus::Live,
        'started_at' => now(),
        'settings' => ['allow_comments' => true, 'allow_reactions' => true],
    ]);

    // Never visited /social/live/{id}, so no viewer session exists.
    $this->actingAs($bystander)
        ->post("/social/live/{$stage->id}/comments", ['body' => 'Sneaking in'])
        ->assertForbidden();
});

test('the host can mute and remove a viewer', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $stage = LiveStage::query()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => LiveStageType::Creator,
        'title' => 'Moderated stream',
        'status' => LiveStageStatus::Live,
        'started_at' => now(),
        'settings' => ['allow_comments' => true, 'allow_reactions' => true],
    ]);

    $this->actingAs($viewer)->get("/social/live/{$stage->id}");

    $this->actingAs($host)
        ->post("/social/live/{$stage->id}/viewers/{$viewer->id}/mute", ['muted' => true])
        ->assertRedirect();

    expect(LiveStageViewerSession::query()
        ->where('live_stage_id', $stage->id)
        ->where('user_id', $viewer->id)
        ->value('is_muted_by_host'))->toBeTrue();

    $this->actingAs($host)
        ->post("/social/live/{$stage->id}/viewers/{$viewer->id}/remove", ['ban' => true])
        ->assertRedirect();

    expect(LiveStageViewerSession::query()
        ->where('live_stage_id', $stage->id)
        ->where('user_id', $viewer->id)
        ->whereNotNull('banned_at')
        ->whereNotNull('left_at')
        ->exists())->toBeTrue();

    // A banned viewer cannot rejoin.
    $this->actingAs($viewer)
        ->post("/social/live/{$stage->id}/comments", ['body' => 'Let me back in'])
        ->assertForbidden();
});

test('a stranger cannot moderate a stage they do not host', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $viewer = socialReadyUser($club);
    $stranger = socialReadyUser($club);

    $stage = LiveStage::query()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => LiveStageType::Creator,
        'title' => 'Protected stream',
        'status' => LiveStageStatus::Live,
        'started_at' => now(),
    ]);

    $this->actingAs($viewer)->get("/social/live/{$stage->id}");

    $this->actingAs($stranger)
        ->post("/social/live/{$stage->id}/viewers/{$viewer->id}/remove", ['ban' => false])
        ->assertForbidden();
});

test('ending a stage marks it ended and clears active viewer sessions', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $stage = LiveStage::query()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => LiveStageType::Creator,
        'title' => 'Wrapping up',
        'status' => LiveStageStatus::Live,
        'started_at' => now(),
    ]);

    $this->actingAs($viewer)->get("/social/live/{$stage->id}");

    $this->actingAs($host)
        ->post("/social/live/{$stage->id}/end")
        ->assertRedirect(route('social.live.index'));

    $stage = $stage->fresh();
    expect($stage->status)->toBe(LiveStageStatus::Ended)
        ->and($stage->ended_at)->not->toBeNull();

    expect(LiveStageViewerSession::query()
        ->where('live_stage_id', $stage->id)
        ->where('user_id', $viewer->id)
        ->whereNull('left_at')
        ->exists())->toBeFalse();

    // A viewer can no longer join an ended stage.
    $viewer2 = socialReadyUser($club);
    $this->actingAs($viewer2)
        ->get("/social/live/{$stage->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('stage.status', 'ended')
            ->where('stage.is_live', false));
});

test('the host leaving a live stage ends it', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);

    $stage = LiveStage::query()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'type' => LiveStageType::Creator,
        'title' => 'Host bails',
        'status' => LiveStageStatus::Live,
        'started_at' => now(),
    ]);

    LiveStageViewerSession::query()->create([
        'live_stage_id' => $stage->id,
        'user_id' => $host->id,
        'joined_at' => now(),
        'last_seen_at' => now(),
    ]);

    $this->actingAs($host)
        ->post("/social/live/{$stage->id}/leave")
        ->assertRedirect();

    expect($stage->fresh()->status)->toBe(LiveStageStatus::Ended);
});
