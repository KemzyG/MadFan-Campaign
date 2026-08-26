<?php

use App\Enums\ChannelScope;
use App\Models\Channel;
use App\Models\Club;
use App\Models\Follow;
use App\Models\Post;
use App\Models\SocialAnnouncement;
use App\Models\SocialNotification;

test('social notifications page requires authentication and onboarding gates', function () {
    $this->get('/social/notifications')->assertRedirect(route('login'));
});

test('liking a post notifies the author but not a self-like', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $liker = socialReadyUser($club);

    $post = Post::factory()->create(['author_id' => $author->id, 'club_id' => $club->id]);

    $this->actingAs($liker)->postJson(route('api.social.posts.like', $post))->assertSuccessful();

    expect(SocialNotification::query()
        ->where('recipient_id', $author->id)
        ->where('actor_id', $liker->id)
        ->where('type', SocialNotification::TYPE_POST_LIKED)
        ->exists())->toBeTrue();

    $selfPost = Post::factory()->create(['author_id' => $liker->id, 'club_id' => $club->id]);
    $this->actingAs($liker)->postJson(route('api.social.posts.like', $selfPost))->assertSuccessful();

    expect(SocialNotification::query()->where('recipient_id', $liker->id)->where('actor_id', $liker->id)->exists())
        ->toBeFalse();
});

test('replying to a post notifies the parent author', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $replier = socialReadyUser($club);

    $post = Post::factory()->create(['author_id' => $author->id, 'club_id' => $club->id]);

    $this->actingAs($replier)
        ->post(route('social.posts.replies.store', $post), ['body' => 'Great point, well made.'])
        ->assertRedirect();

    expect(SocialNotification::query()
        ->where('recipient_id', $author->id)
        ->where('actor_id', $replier->id)
        ->where('type', SocialNotification::TYPE_POST_REPLIED)
        ->exists())->toBeTrue();
});

test('tagging a followed user in a post notifies them', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $friend = socialReadyUser($club);
    $stranger = socialReadyUser($club);

    Follow::query()->create(['follower_id' => $author->id, 'following_id' => $friend->id]);

    $this->actingAs($author)
        ->post(route('social.posts.store'), [
            'body' => 'On the terrace with a mate.',
            'tagged' => [$friend->id, $stranger->id],
        ])
        ->assertRedirect();

    $post = Post::query()->where('author_id', $author->id)->latest('id')->first();

    expect(SocialNotification::query()
        ->where('recipient_id', $friend->id)
        ->where('type', SocialNotification::TYPE_POST_TAGGED)
        ->where('notifiable_id', $post->id)
        ->exists())->toBeTrue()
        ->and(SocialNotification::query()->where('recipient_id', $stranger->id)->exists())->toBeFalse();
});

test('a chat message notifies other channel members but not the sender', function () {
    $club = Club::factory()->create();
    $sender = socialReadyUser($club);
    $member = socialReadyUser($club);

    $this->actingAs($sender)->get('/social/chat')->assertSuccessful();
    $channel = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($sender)
        ->postJson(route('api.social.chat.messages.store', $channel), ['body' => 'Kickoff soon.'])
        ->assertCreated();

    expect(SocialNotification::query()
        ->where('recipient_id', $member->id)
        ->where('actor_id', $sender->id)
        ->where('type', SocialNotification::TYPE_CHAT_MESSAGE)
        ->exists())->toBeTrue()
        ->and(SocialNotification::query()->where('recipient_id', $sender->id)->exists())->toBeFalse();
});

test('a club chat notification deep-links to the slug-based thread route', function () {
    $club = Club::factory()->create();
    $sender = socialReadyUser($club);
    $member = socialReadyUser($club);

    $this->actingAs($sender)->get('/social/chat')->assertSuccessful();
    $channel = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($sender)
        ->postJson(route('api.social.chat.messages.store', $channel), ['body' => 'Kickoff soon.'])
        ->assertCreated();

    $this->actingAs($member)
        ->get('/social/notifications')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('notifications.data.0.href', '/social/chat/thread/general'));
});

test('a direct-message notification deep-links to the numeric thread route, not a broken slug', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $peer = socialReadyUser($club);

    Follow::factory()->create([
        'follower_id' => $peer->id,
        'following_id' => $viewer->id,
        'created_at' => now(),
    ]);

    $this->actingAs($peer)
        ->post(route('social.chat.direct.store'), ['user_id' => $viewer->id])
        ->assertRedirect();

    $channel = Channel::query()->where('scope', ChannelScope::Direct)->firstOrFail();

    $this->actingAs($peer)
        ->post(route('social.chat.messages.store', $channel), ['body' => 'Hey, joining?'])
        ->assertRedirect();

    $this->actingAs($viewer)
        ->get('/social/notifications')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('notifications.data.0.href', '/social/chat/thread/'.$channel->id));
});

test('a published announcement notifies every fan', function () {
    $fanOne = socialReadyUser();
    $fanTwo = socialReadyUser();

    $announcement = SocialAnnouncement::factory()->create([
        'headline' => 'New kit drop tonight',
        'published_at' => now()->subMinute(),
    ]);

    foreach ([$fanOne, $fanTwo] as $fan) {
        expect(SocialNotification::query()
            ->where('recipient_id', $fan->id)
            ->where('type', SocialNotification::TYPE_ANNOUNCEMENT)
            ->where('notifiable_id', $announcement->id)
            ->exists())->toBeTrue();
    }
});

test('a scheduled future announcement does not notify yet', function () {
    $fan = socialReadyUser();

    SocialAnnouncement::factory()->create([
        'published_at' => now()->addDay(),
    ]);

    expect(SocialNotification::query()->where('recipient_id', $fan->id)->exists())->toBeFalse();
});

test('notifications page lists the viewer own notifications with unread count', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $liker = socialReadyUser($club);
    $post = Post::factory()->create(['author_id' => $author->id, 'club_id' => $club->id]);

    $this->actingAs($liker)->postJson(route('api.social.posts.like', $post))->assertSuccessful();

    $this->actingAs($author)
        ->get('/social/notifications')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Notifications/Index')
            ->where('unread_count', 1)
            ->has('notifications.data', 1)
            ->where('notifications.data.0.type', SocialNotification::TYPE_POST_LIKED)
            ->where('notifications.data.0.read', false)
            ->where('notifications.data.0.actor.id', $liker->id));
});

test('marking a notification read updates its state and the unread count', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $liker = socialReadyUser($club);
    $post = Post::factory()->create(['author_id' => $author->id, 'club_id' => $club->id]);

    $this->actingAs($liker)->postJson(route('api.social.posts.like', $post))->assertSuccessful();
    $notification = SocialNotification::query()->where('recipient_id', $author->id)->firstOrFail();

    $this->actingAs($author)
        ->postJson(route('api.social.notifications.read', $notification))
        ->assertSuccessful();

    expect($notification->fresh()->read_at)->not->toBeNull();

    $this->actingAs($author)
        ->getJson(route('api.social.notifications.unread-count'))
        ->assertSuccessful()
        ->assertJsonPath('unread_count', 0);
});

test('marking a notification read is forbidden for someone else', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $liker = socialReadyUser($club);
    $outsider = socialReadyUser($club);
    $post = Post::factory()->create(['author_id' => $author->id, 'club_id' => $club->id]);

    $this->actingAs($liker)->postJson(route('api.social.posts.like', $post))->assertSuccessful();
    $notification = SocialNotification::query()->where('recipient_id', $author->id)->firstOrFail();

    $this->actingAs($outsider)
        ->postJson(route('api.social.notifications.read', $notification))
        ->assertForbidden();
});

test('mark all read clears every unread notification for the viewer', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $likerOne = socialReadyUser($club);
    $likerTwo = socialReadyUser($club);
    $postOne = Post::factory()->create(['author_id' => $author->id, 'club_id' => $club->id]);
    $postTwo = Post::factory()->create(['author_id' => $author->id, 'club_id' => $club->id]);

    $this->actingAs($likerOne)->postJson(route('api.social.posts.like', $postOne))->assertSuccessful();
    $this->actingAs($likerTwo)->postJson(route('api.social.posts.like', $postTwo))->assertSuccessful();

    $this->actingAs($author)
        ->postJson(route('api.social.notifications.read-all'))
        ->assertSuccessful();

    expect(SocialNotification::query()->where('recipient_id', $author->id)->unread()->count())->toBe(0);
});
