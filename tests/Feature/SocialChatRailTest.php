<?php

use App\Enums\ChannelScope;
use App\Models\Channel;
use App\Models\Club;
use App\Models\Follow;

test('the chat rail requires an onboarded fan', function () {
    $this->getJson('/api/social/chat/rail')->assertUnauthorized();
});

test('the chat rail lists club channels for a fresh fan', function () {
    $user = socialReadyUser(Club::factory()->create(['name' => 'Radio FC']));

    $response = $this->actingAs($user)
        ->getJson('/api/social/chat/rail')
        ->assertSuccessful();

    $names = collect($response->json('data'))->pluck('name')->all();

    expect($names)->toContain('general')
        ->and(collect($response->json('data'))->pluck('scope')->unique()->all())
        ->toBe([ChannelScope::Club->value]);
});

test('the chat rail sorts every conversation by its last message', function () {
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

    $direct = Channel::query()->where('scope', ChannelScope::Direct)->firstOrFail();

    // The club server and its default channels are provisioned on first read.
    $this->actingAs($viewer)->getJson('/api/social/chat/rail')->assertSuccessful();

    $general = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($viewer)
        ->post(route('social.chat.messages.store', $general), ['body' => 'Club shout first.'])
        ->assertRedirect();

    $this->travel(2)->minutes();

    $this->actingAs($viewer)
        ->post(route('social.chat.messages.store', $direct), ['body' => 'DM lands last.'])
        ->assertRedirect();

    $rows = $this->actingAs($viewer)
        ->getJson('/api/social/chat/rail')
        ->assertSuccessful()
        ->json('data');

    expect($rows[0]['scope'])->toBe(ChannelScope::Direct->value)
        ->and($rows[0]['last_message']['body'])->toBe('DM lands last.')
        ->and($rows[0]['last_message']['is_mine'])->toBeTrue()
        ->and($rows[1]['last_message']['body'])->toBe('Club shout first.');
});

test('the chat rail never leaks a conversation the viewer is not in', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $a = socialReadyUser($club);
    $b = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $a->id,
        'following_id' => $b->id,
        'created_at' => now(),
    ]);

    $this->actingAs($a)
        ->post(route('social.chat.direct.store'), ['user_id' => $b->id])
        ->assertRedirect();

    $theirs = Channel::query()->where('scope', ChannelScope::Direct)->firstOrFail();

    $rows = $this->actingAs($viewer)
        ->getJson('/api/social/chat/rail')
        ->assertSuccessful()
        ->json('data');

    expect(collect($rows)->pluck('id')->all())->not->toContain($theirs->id);
});
