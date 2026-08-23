<?php

use App\Enums\ChannelScope;
use App\Models\Channel;
use App\Models\Club;
use App\Models\Follow;
use App\Models\User;

test('a social request stamps last_seen_at once per minute without touching updated_at', function () {
    $user = socialReadyUser();
    expect($user->last_seen_at)->toBeNull();

    $originalUpdatedAt = $user->updated_at->toDateTimeString();

    // Advance the clock so a stray updated_at write would be visible.
    $this->travel(2)->minutes();
    $this->actingAs($user)->getJson('/api/social/chat/rail')->assertSuccessful();

    $user->refresh();
    expect($user->last_seen_at)->not->toBeNull()
        ->and($user->updated_at->toDateTimeString())->toBe($originalUpdatedAt);

    // A second request inside the 60s gate must not move the heartbeat.
    $firstSeen = $user->last_seen_at->toDateTimeString();
    $this->travel(20)->seconds();
    $this->actingAs($user)->getJson('/api/social/chat/rail')->assertSuccessful();

    $user->refresh();
    expect($user->last_seen_at->toDateTimeString())->toBe($firstSeen);

    // Past the gate, the next request refreshes it again.
    $this->travel(90)->seconds();
    $this->actingAs($user)->getJson('/api/social/chat/rail')->assertSuccessful();

    $user->refresh();
    expect($user->last_seen_at->toDateTimeString())->not->toBe($firstSeen);
});

test('isOnline and the online scope treat five minutes as the boundary', function () {
    $club = Club::factory()->create();
    $fresh = socialReadyUser($club);
    $stale = socialReadyUser($club);

    $fresh->forceFill(['last_seen_at' => now()->subMinutes(4)])->save();
    $stale->forceFill(['last_seen_at' => now()->subMinutes(6)])->save();

    expect($fresh->fresh()->isOnline())->toBeTrue()
        ->and($stale->fresh()->isOnline())->toBeFalse();

    $onlineIds = User::query()->online()->pluck('id')->all();
    expect($onlineIds)->toContain($fresh->id)
        ->and($onlineIds)->not->toContain($stale->id);
});

test('a direct thread header reports peer presence', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $viewer->id,
        'following_id' => $peer->id,
        'created_at' => now(),
    ]);

    $this->actingAs($viewer)
        ->post(route('social.chat.direct.store'), ['user_id' => $peer->id])
        ->assertRedirect();

    $channel = Channel::query()->where('scope', ChannelScope::Direct)->firstOrFail();

    $peer->forceFill(['last_seen_at' => now()])->save();

    $this->actingAs($viewer)
        ->get('/social/chat?inbox=friends&channel='.$channel->id)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('channel.peer.is_online', true));

    $peer->forceFill(['last_seen_at' => now()->subMinutes(30)])->save();
    $stamp = $peer->fresh()->last_seen_at->toIso8601String();

    $this->actingAs($viewer)
        ->get('/social/chat?inbox=friends&channel='.$channel->id)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('channel.peer.is_online', false)
            ->where('channel.peer.last_seen_at', $stamp));
});

test('a group thread header counts only members inside the window', function () {
    $club = Club::factory()->create();
    $creator = socialReadyUser($club);
    $a = socialReadyUser($club);
    $b = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $creator->id,
        'following_id' => $a->id,
        'created_at' => now(),
    ]);
    Follow::factory()->create([
        'follower_id' => $b->id,
        'following_id' => $creator->id,
        'created_at' => now(),
    ]);

    $this->actingAs($creator)
        ->post(route('social.chat.groups.store'), [
            'name' => 'Derby Watch',
            'member_ids' => [$a->id, $b->id],
        ])
        ->assertRedirect();

    $channel = Channel::query()->where('scope', ChannelScope::Group)->firstOrFail();

    // Pin presence after group creation (which heartbeats the creator): only b is
    // inside the window, the viewer (a) and creator are stale.
    $creator->forceFill(['last_seen_at' => now()->subMinutes(30)])->save();
    $a->forceFill(['last_seen_at' => now()->subMinutes(30)])->save();
    $b->forceFill(['last_seen_at' => now()])->save();

    $this->actingAs($a)
        ->get('/social/chat?inbox=groups&channel='.$channel->id)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('channel.presence.scope', 'group')
            ->where('channel.presence.total', 3)
            ->where('channel.presence.online', 1));
});

test('a club thread header counts online fans across the whole fanbase', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $onlineFan = socialReadyUser($club);
    $offlineFan = socialReadyUser($club);
    socialReadyUser(); // a fan of a different club — must not be counted

    $onlineFan->forceFill(['last_seen_at' => now()])->save();
    $offlineFan->forceFill(['last_seen_at' => now()->subMinutes(30)])->save();

    $this->actingAs($viewer)
        ->get('/social/chat?inbox=club&channel=general')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('channel.presence.scope', 'club')
            ->where('channel.presence.total', 3)
            ->where('channel.presence.online', 1));
});

test('the members endpoint returns a direct roster to a member', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $viewer->id,
        'following_id' => $peer->id,
        'created_at' => now(),
    ]);

    $this->actingAs($viewer)
        ->post(route('social.chat.direct.store'), ['user_id' => $peer->id])
        ->assertRedirect();

    $channel = Channel::query()->where('scope', ChannelScope::Direct)->firstOrFail();
    $peer->forceFill(['last_seen_at' => now()])->save();

    $this->actingAs($viewer)
        ->getJson('/api/social/chat/channels/'.$channel->id.'/members')
        ->assertSuccessful()
        ->assertJsonPath('data.scope', 'direct')
        ->assertJsonPath('data.total_count', 1)
        ->assertJsonPath('data.online_count', 1)
        ->assertJsonPath('data.members.0.id', $peer->id)
        ->assertJsonPath('data.members.0.is_online', true);
});

test('the members endpoint returns the club roster to a fan', function () {
    $club = Club::factory()->create();
    $fan = socialReadyUser($club);
    $onlineFan = socialReadyUser($club);
    $sleeper = socialReadyUser($club);

    $onlineFan->forceFill(['last_seen_at' => now()])->save();
    $sleeper->forceFill(['last_seen_at' => now()->subMinutes(30)])->save();

    // Provision the club server + channels on first read.
    $this->actingAs($fan)->getJson('/api/social/chat/rail')->assertSuccessful();
    $general = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($fan)
        ->getJson('/api/social/chat/channels/'.$general->id.'/members')
        ->assertSuccessful()
        ->assertJsonPath('data.scope', 'club')
        ->assertJsonPath('data.title', 'Fans')
        ->assertJsonPath('data.total_count', 3)
        ->assertJsonPath('data.online_count', 2)
        ->assertJsonCount(3, 'data.members');
});

test('the members endpoint rejects a non-member', function () {
    $club = Club::factory()->create();
    $a = socialReadyUser($club);
    $b = socialReadyUser($club);
    $outsider = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $a->id,
        'following_id' => $b->id,
        'created_at' => now(),
    ]);

    $this->actingAs($a)
        ->post(route('social.chat.direct.store'), ['user_id' => $b->id])
        ->assertRedirect();

    $channel = Channel::query()->where('scope', ChannelScope::Direct)->firstOrFail();

    $this->actingAs($outsider)
        ->getJson('/api/social/chat/channels/'.$channel->id.'/members')
        ->assertForbidden();
});

test('the members endpoint rejects a club roster request from a non-fan', function () {
    $clubA = Club::factory()->create();
    $clubB = Club::factory()->create();
    $fan = socialReadyUser($clubA);
    $outsider = socialReadyUser($clubB);

    $this->actingAs($fan)->getJson('/api/social/chat/rail')->assertSuccessful();
    $general = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($outsider)
        ->getJson('/api/social/chat/channels/'.$general->id.'/members')
        ->assertForbidden();
});
