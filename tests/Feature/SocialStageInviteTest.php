<?php

use App\Models\Club;
use App\Models\Follow;
use App\Models\SocialNotification;
use App\Models\Stage;
use App\Models\StageParticipant;

test('host can invite a follow connection who is not already in the room', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $fan = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $host->id,
        'following_id' => $fan->id,
        'created_at' => now(),
    ]);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'Matchday watch-along',
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/invite", ['user_ids' => [$fan->id]])
        ->assertRedirect()
        ->assertSessionHas('success');

    $notification = SocialNotification::query()
        ->where('recipient_id', $fan->id)
        ->where('actor_id', $host->id)
        ->where('type', SocialNotification::TYPE_STAGE_INVITE)
        ->first();

    expect($notification)->not->toBeNull()
        ->and($notification->notifiable_type)->toBe((new Stage)->getMorphClass())
        ->and($notification->notifiable_id)->toBe($stage->id)
        ->and($notification->data['stage_title'])->toBe('Matchday watch-along');
});

test('inviting someone already in the room notifies nobody', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $listener = socialReadyUser($club);

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
        'user_id' => $listener->id,
    ]);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/invite", ['user_ids' => [$listener->id]])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(SocialNotification::query()->where('recipient_id', $listener->id)->exists())->toBeFalse();
});

test('inviting is blocked when invites are disabled for the stage', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $fan = socialReadyUser($club);

    $stage = Stage::factory()->live()->withoutInvites()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/invite", ['user_ids' => [$fan->id]])
        ->assertForbidden();
});

test('a non-participant cannot invite people into a stage', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $outsider = socialReadyUser($club);
    $fan = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($outsider)
        ->post("/social/stage/{$stage->id}/invite", ['user_ids' => [$fan->id]])
        ->assertForbidden();
});

test('invite candidates list follow connections minus current participants', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $followedFan = socialReadyUser($club);
    $inRoomFan = socialReadyUser($club);
    $stranger = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $host->id,
        'following_id' => $followedFan->id,
        'created_at' => now(),
    ]);
    Follow::factory()->create([
        'follower_id' => $host->id,
        'following_id' => $inRoomFan->id,
        'created_at' => now(),
    ]);

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
        'user_id' => $inRoomFan->id,
    ]);

    $response = $this->actingAs($host)
        ->getJson("/api/social/stage/{$stage->id}/invite-candidates")
        ->assertSuccessful();

    $ids = collect($response->json('data'))->pluck('id');

    expect($ids)->toContain($followedFan->id)
        ->and($ids)->not->toContain($inRoomFan->id)
        ->and($ids)->not->toContain($stranger->id)
        ->and($ids)->not->toContain($host->id);
});

test('a stage invite notification deep-links to the stage room', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $fan = socialReadyUser($club);

    $stage = Stage::factory()->live()->create([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'Post-match reaction',
    ]);

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/invite", ['user_ids' => [$fan->id]])
        ->assertRedirect();

    $this->actingAs($fan)
        ->getJson('/api/social/notifications/unread-count')
        ->assertSuccessful()
        ->assertJsonPath('unread_count', 1);

    $this->actingAs($fan)
        ->get('/social/notifications')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('notifications.data.0.type', SocialNotification::TYPE_STAGE_INVITE)
            ->where('notifications.data.0.href', '/social/stage/'.$stage->id)
            ->where('notifications.data.0.message', $host->name.' invited you to Post-match reaction'));
});
