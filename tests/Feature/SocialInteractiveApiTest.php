<?php

use App\Enums\ChannelScope;
use App\Models\Channel;
use App\Models\Club;
use App\Models\Follow;
use App\Models\MatchFixture;
use App\Models\MatchTicket;
use App\Models\Message;
use App\Models\Post;
use App\Models\PostLike;

test('api like and unlike return json payloads', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'body' => 'Like me via API',
    ]);

    $this->actingAs($viewer)
        ->postJson(route('api.social.posts.like', $post))
        ->assertSuccessful()
        ->assertJsonPath('liked', true)
        ->assertJsonPath('likes_count', 1)
        ->assertJsonStructure(['message', 'liked', 'likes_count']);

    expect(PostLike::query()->where('post_id', $post->id)->where('user_id', $viewer->id)->exists())->toBeTrue();

    $this->actingAs($viewer)
        ->deleteJson(route('api.social.posts.unlike', $post))
        ->assertSuccessful()
        ->assertJsonPath('liked', false)
        ->assertJsonPath('likes_count', 0);

    expect(PostLike::query()->where('post_id', $post->id)->where('user_id', $viewer->id)->exists())->toBeFalse();
});

test('api like returns json forbidden for guests', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
    ]);

    $this->postJson(route('api.social.posts.like', $post))
        ->assertUnauthorized();
});

test('api follow and unfollow return json payloads', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $target = socialReadyUser($club);

    $this->actingAs($viewer)
        ->postJson(route('api.social.users.follow', $target))
        ->assertSuccessful()
        ->assertJsonPath('following', true)
        ->assertJsonPath('user_id', $target->id)
        ->assertJsonStructure(['message', 'following', 'user_id']);

    expect(Follow::query()->where('follower_id', $viewer->id)->where('following_id', $target->id)->exists())
        ->toBeTrue();

    $this->actingAs($viewer)
        ->deleteJson(route('api.social.users.unfollow', $target))
        ->assertSuccessful()
        ->assertJsonPath('following', false);

    expect(Follow::query()->where('follower_id', $viewer->id)->where('following_id', $target->id)->exists())
        ->toBeFalse();
});

test('api follow self returns json validation error', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->postJson(route('api.social.users.follow', $user))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['user']);
});

test('api chat message store returns presented message json', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)->get('/social/chat')->assertSuccessful();

    $channel = Channel::query()->where('slug', 'general')->where('scope', ChannelScope::Club)->firstOrFail();

    $response = $this->actingAs($user)
        ->postJson(route('api.social.chat.messages.store', $channel), [
            'body' => 'API terrace shout.',
        ])
        ->assertCreated()
        ->assertJsonPath('message', 'Message sent.')
        ->assertJsonPath('data.body', 'API terrace shout.')
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'body', 'type', 'created_at', 'author'],
        ]);

    expect(Message::query()->whereKey($response->json('data.id'))->exists())->toBeTrue();
});

test('api chat message validation returns json errors', function () {
    $user = socialReadyUser();
    $this->actingAs($user)->get('/social/chat')->assertSuccessful();
    $channel = Channel::query()->where('slug', 'general')->where('scope', ChannelScope::Club)->firstOrFail();

    $this->actingAs($user)
        ->postJson(route('api.social.chat.messages.store', $channel), [
            'body' => '   ',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['body']);
});

test('api chat message to foreign club returns json forbidden', function () {
    $home = Club::factory()->create();
    $away = Club::factory()->create();
    $member = socialReadyUser($home);
    $rival = socialReadyUser($away);

    $this->actingAs($rival)->get('/social/chat')->assertSuccessful();

    $awayChannel = Channel::query()
        ->where('slug', 'general')
        ->whereHas('clubServer', fn ($q) => $q->where('club_id', $away->id))
        ->firstOrFail();

    $this->actingAs($member)
        ->postJson(route('api.social.chat.messages.store', $awayChannel), [
            'body' => 'Wrong terrace.',
        ])
        ->assertForbidden()
        ->assertJsonStructure(['message']);

    expect(Message::query()->count())->toBe(0);
});

test('api ticket purchase and show return json', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $away = Club::factory()->create();

    $match = MatchFixture::factory()->upcoming()->create([
        'home_club_id' => $club->id,
        'away_club_id' => $away->id,
        'price' => '28.00',
        'venue' => 'API Stand',
    ]);

    $purchase = $this->actingAs($user)
        ->postJson(route('api.social.tickets.purchase', $match))
        ->assertCreated()
        ->assertJsonPath('ticket.match.venue', 'API Stand')
        ->assertJsonStructure(['message', 'ticket', 'ticket_count']);

    $ticketId = $purchase->json('ticket.id');

    expect(MatchTicket::query()->whereKey($ticketId)->exists())->toBeTrue();

    $this->actingAs($user)
        ->getJson(route('api.social.tickets.show', $ticketId))
        ->assertSuccessful()
        ->assertJsonPath('ticket.id', $ticketId)
        ->assertJsonStructure(['message', 'ticket' => ['code', 'qr_payload', 'status']]);
});

test('api ticket purchase duplicate returns json validation error', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $away = Club::factory()->create();

    $match = MatchFixture::factory()->upcoming()->create([
        'home_club_id' => $club->id,
        'away_club_id' => $away->id,
    ]);

    $this->actingAs($user)
        ->postJson(route('api.social.tickets.purchase', $match))
        ->assertCreated();

    $this->actingAs($user)
        ->postJson(route('api.social.tickets.purchase', $match))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['match']);
});
