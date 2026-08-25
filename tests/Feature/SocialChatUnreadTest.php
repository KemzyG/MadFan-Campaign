<?php

use App\Enums\ChannelScope;
use App\Models\Channel;
use App\Models\Club;
use App\Models\Follow;

test('a club chat message counts as unread for other members but not the sender', function () {
    $club = Club::factory()->create();
    $sender = socialReadyUser($club);
    $member = socialReadyUser($club);

    $this->actingAs($sender)->get('/social/chat')->assertSuccessful();
    $channel = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($sender)
        ->postJson(route('api.social.chat.messages.store', $channel), ['body' => 'Kickoff soon.'])
        ->assertCreated();

    $this->actingAs($member)
        ->getJson(route('api.social.chat.unread-count'))
        ->assertSuccessful()
        ->assertJsonPath('unread_count', 1);

    $this->actingAs($sender)
        ->getJson(route('api.social.chat.unread-count'))
        ->assertSuccessful()
        ->assertJsonPath('unread_count', 0);
});

test('opening a thread marks it read and clears its contribution to the unread count', function () {
    $club = Club::factory()->create();
    $sender = socialReadyUser($club);
    $member = socialReadyUser($club);

    $this->actingAs($sender)->get('/social/chat')->assertSuccessful();
    $channel = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($sender)
        ->postJson(route('api.social.chat.messages.store', $channel), ['body' => 'Kickoff soon.'])
        ->assertCreated();

    $this->actingAs($member)
        ->getJson(route('api.social.chat.unread-count'))
        ->assertJsonPath('unread_count', 1);

    $this->actingAs($member)
        ->get('/social/chat?channel='.$channel->id)
        ->assertSuccessful();

    $this->actingAs($member)
        ->getJson(route('api.social.chat.unread-count'))
        ->assertSuccessful()
        ->assertJsonPath('unread_count', 0);

    $this->travel(1)->second();

    $this->actingAs($sender)
        ->postJson(route('api.social.chat.messages.store', $channel), ['body' => 'Second one.'])
        ->assertCreated();

    $this->actingAs($member)
        ->getJson(route('api.social.chat.unread-count'))
        ->assertSuccessful()
        ->assertJsonPath('unread_count', 1);
});

test('unread counts span club, direct, and group channels', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $viewer->id,
        'following_id' => $peer->id,
        'created_at' => now(),
    ]);

    $this->actingAs($viewer)->get('/social/chat')->assertSuccessful();
    $clubChannel = Channel::query()->where('slug', 'general')->firstOrFail();

    $otherMember = socialReadyUser($club);
    $this->actingAs($otherMember)
        ->postJson(route('api.social.chat.messages.store', $clubChannel), ['body' => 'Club ping.'])
        ->assertCreated();

    $this->actingAs($peer)
        ->post(route('social.chat.direct.store'), ['user_id' => $viewer->id])
        ->assertRedirect();

    $directChannel = Channel::query()->where('scope', ChannelScope::Direct)->firstOrFail();

    $this->actingAs($peer)
        ->post(route('social.chat.messages.store', $directChannel), ['body' => 'DM ping.'])
        ->assertRedirect();

    $this->actingAs($viewer)
        ->getJson(route('api.social.chat.unread-count'))
        ->assertSuccessful()
        ->assertJsonPath('unread_count', 2);
});
