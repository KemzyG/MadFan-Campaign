<?php

use App\Enums\ChannelScope;
use App\Models\Channel;
use App\Models\Club;
use App\Models\Follow;
use App\Models\Message;

test('chat page defaults to the friends inbox when none is requested', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->get('/social/chat')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Chat/Index')
            ->where('inbox', 'friends')
            ->where('channel', null)
            ->has('friend_candidates')
            ->has('group_candidates')
            ->has('threads'));
});

test('chat page exposes club friends and groups inboxes', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->get('/social/chat?inbox=club')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Chat/Index')
            ->where('inbox', 'club')
            ->has('channels', 2)
            ->has('messages.items', 0)
            ->has('friend_candidates')
            ->has('group_candidates')
            ->has('threads'));

    $this->actingAs($user)
        ->get('/social/chat?inbox=friends')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Chat/Index')
            ->where('inbox', 'friends')
            ->where('channel', null));

    $this->actingAs($user)
        ->get('/social/chat?inbox=groups')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Chat/Index')
            ->where('inbox', 'groups')
            ->where('channel', null));
});

test('fans can open a friends direct chat and send left-right messages', function () {
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

    $channel = Channel::query()->where('scope', ChannelScope::Direct)->first();

    expect($channel)->not->toBeNull()
        ->and($channel->conversation_key)->toBe('dm:'.min($viewer->id, $peer->id).':'.max($viewer->id, $peer->id));

    $this->actingAs($viewer)
        ->post(route('social.chat.messages.store', $channel), [
            'body' => 'Terrace ping from me.',
        ])
        ->assertRedirect(route('social.chat', [
            'inbox' => 'friends',
            'channel' => (string) $channel->id,
        ]));

    $this->actingAs($viewer)
        ->get('/social/chat?inbox=friends&channel='.$channel->id)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Chat/Index')
            ->where('inbox', 'friends')
            ->where('channel.id', $channel->id)
            ->has('messages.items', 1)
            ->where('messages.items.0.body', 'Terrace ping from me.')
            ->where('messages.items.0.is_mine', true));

    $this->actingAs($peer)
        ->get('/social/chat?inbox=friends&channel='.$channel->id)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('messages.items.0.is_mine', false));
});

test('fans can create a group chat and exchange messages', function () {
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

    $channel = Channel::query()->where('scope', ChannelScope::Group)->first();

    expect($channel)->not->toBeNull()
        ->and($channel->name)->toBe('Derby Watch')
        ->and($channel->members()->count())->toBe(3);

    $this->actingAs($creator)
        ->post(route('social.chat.messages.store', $channel), [
            'body' => 'Kick-off in five.',
        ])
        ->assertRedirect(route('social.chat', [
            'inbox' => 'groups',
            'channel' => (string) $channel->id,
        ]));

    expect(Message::query()->where('channel_id', $channel->id)->count())->toBe(1);

    $this->actingAs($a)
        ->get('/social/chat?inbox=groups&channel='.$channel->id)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('inbox', 'groups')
            ->where('channel.name', 'Derby Watch')
            ->where('messages.items.0.is_mine', false));
});

test('direct chat requires a follow connection', function () {
    $viewer = socialReadyUser();
    $stranger = socialReadyUser();

    $this->actingAs($viewer)
        ->post(route('social.chat.direct.store'), ['user_id' => $stranger->id])
        ->assertSessionHasErrors('user_id');

    expect(Channel::query()->where('scope', ChannelScope::Direct)->count())->toBe(0);
});

test('club chat still works with inbox query and marks own messages', function () {
    $user = socialReadyUser();

    $this->actingAs($user)->get('/social/chat?inbox=club')->assertSuccessful();

    $channel = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($user)
        ->post(route('social.chat.messages.store', $channel), [
            'body' => 'Club shout still lands.',
        ])
        ->assertRedirect(route('social.chat', [
            'inbox' => 'club',
            'channel' => 'general',
        ]));

    $this->actingAs($user)
        ->get('/social/chat?inbox=club&channel=general')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('inbox', 'club')
            ->where('messages.items.0.is_mine', true)
            ->where('messages.items.0.body', 'Club shout still lands.'));
});
