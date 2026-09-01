<?php

use App\Actions\Social\EnsureDirectChatChannel;
use App\Enums\ChannelScope;
use App\Enums\SocialReportTarget;
use App\Models\Channel;
use App\Models\Club;
use App\Models\Follow;
use App\Models\Message;
use App\Models\SocialReport;
use App\Models\UserBlock;
use Illuminate\Http\UploadedFile;

test('chat messages payload includes pagination meta', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->get('/social/chat?inbox=fandom')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('messages.items')
            ->has('messages.has_more')
            ->has('messages.oldest_id'));
});

test('author can delete their chat message via api', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $viewer->id,
        'following_id' => $peer->id,
    ]);

    $channel = app(EnsureDirectChatChannel::class)->handle($viewer, $peer);

    $this->actingAs($viewer)
        ->postJson("/api/social/chat/channels/{$channel->id}/messages", [
            'body' => 'Delete me later.',
        ])
        ->assertCreated();

    $message = Message::query()->where('channel_id', $channel->id)->first();

    $this->actingAs($viewer)
        ->deleteJson("/api/social/chat/messages/{$message->id}")
        ->assertSuccessful();

    expect($message->fresh()->trashed())->toBeTrue();
});

test('author can edit a chat message within five minutes', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $viewer->id,
        'following_id' => $peer->id,
    ]);

    $channel = app(EnsureDirectChatChannel::class)->handle($viewer, $peer);

    $this->actingAs($viewer)
        ->postJson("/api/social/chat/channels/{$channel->id}/messages", [
            'body' => 'Original text.',
        ])
        ->assertCreated();

    $message = Message::query()->where('channel_id', $channel->id)->first();

    $this->actingAs($viewer)
        ->patchJson("/api/social/chat/messages/{$message->id}", [
            'body' => 'Edited text.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.body', 'Edited text.');

    expect($message->fresh()->edited_at)->not->toBeNull();
});

test('blocked fans cannot start a direct chat', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $viewer->id,
        'following_id' => $peer->id,
    ]);

    UserBlock::query()->create([
        'blocker_id' => $peer->id,
        'blocked_id' => $viewer->id,
    ]);

    $this->actingAs($viewer)
        ->post(route('social.chat.direct.store'), ['user_id' => $peer->id])
        ->assertSessionHasErrors('user_id');
});

test('chat message history can be fetched before an id', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $viewer->id,
        'following_id' => $peer->id,
    ]);

    $channel = app(EnsureDirectChatChannel::class)->handle($viewer, $peer);

    foreach (range(1, 4) as $index) {
        Message::factory()->create([
            'channel_id' => $channel->id,
            'author_id' => $viewer->id,
            'body' => "Message {$index}",
        ]);
    }

    $newest = Message::query()->where('channel_id', $channel->id)->orderByDesc('id')->first();

    $this->actingAs($viewer)
        ->getJson("/api/social/chat/channels/{$channel->id}/messages?before_id={$newest->id}&limit=2")
        ->assertSuccessful()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.has_more', true);
});

test('fans can report a chat message', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $viewer->id,
        'following_id' => $peer->id,
    ]);

    $channel = app(EnsureDirectChatChannel::class)->handle($viewer, $peer);

    $message = Message::factory()->create([
        'channel_id' => $channel->id,
        'author_id' => $peer->id,
        'body' => 'Report this.',
    ]);

    $this->actingAs($viewer)
        ->postJson("/api/social/chat/messages/{$message->id}/report", [
            'reason' => 'abuse',
        ])
        ->assertCreated();

    expect(SocialReport::query()
        ->where('reporter_id', $viewer->id)
        ->where('target_type', SocialReportTarget::Message)
        ->where('target_id', $message->id)
        ->exists())->toBeTrue();
});

test('fans can send a voice note attachment in chat', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $viewer->id,
        'following_id' => $peer->id,
    ]);

    $channel = app(EnsureDirectChatChannel::class)->handle($viewer, $peer);

    $this->actingAs($viewer)
        ->postJson("/api/social/chat/channels/{$channel->id}/messages", [
            'attachment' => UploadedFile::fake()->create('voice.webm', 120, 'audio/webm'),
        ])
        ->assertCreated()
        ->assertJsonPath('data.type', 'voice')
        ->assertJsonPath('data.media.type', 'audio');
});

test('direct thread list includes unread counts sorted by recent activity', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $viewer->id,
        'following_id' => $peer->id,
    ]);

    $channel = app(EnsureDirectChatChannel::class)->handle($viewer, $peer);

    Message::factory()->create([
        'channel_id' => $channel->id,
        'author_id' => $peer->id,
        'body' => 'Unread ping',
    ]);

    $this->actingAs($viewer)
        ->get('/social/chat?inbox=friends')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('threads', 1)
            ->where('threads.0.unread_count', 1)
            ->where('threads.0.last_message.body', 'Unread ping'));
});

test('members endpoint uses channel policy instead of favourite-only checks', function () {
    $viewer = socialReadyUser();
    $channel = Channel::query()->where('scope', ChannelScope::Direct)->first();

    if ($channel === null) {
        $peer = socialReadyUser();
        Follow::factory()->create([
            'follower_id' => $viewer->id,
            'following_id' => $peer->id,
        ]);
        $channel = app(EnsureDirectChatChannel::class)->handle($viewer, $peer);
    }

    $this->actingAs($viewer)
        ->getJson("/api/social/chat/channels/{$channel->id}/members")
        ->assertSuccessful()
        ->assertJsonStructure(['data']);
});
