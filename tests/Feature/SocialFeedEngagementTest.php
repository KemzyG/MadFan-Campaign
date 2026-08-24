<?php

use App\Models\Club;
use App\Models\Post;
use App\Models\PostBookmark;
use App\Models\PostHide;
use App\Models\PostView;

test('opening a post thread records a unique view for other fans', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'body' => 'Floodlights on',
        'views_count' => 0,
    ]);

    $this->actingAs($viewer)
        ->get(route('social.posts.show', $post))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/PostShow')
            ->where('post.views_count', 1));

    expect(PostView::query()->where('post_id', $post->id)->where('user_id', $viewer->id)->exists())->toBeTrue();
    expect($post->fresh()->views_count)->toBe(1);

    $this->actingAs($viewer)
        ->get(route('social.posts.show', $post))
        ->assertSuccessful();

    expect($post->fresh()->views_count)->toBe(1);
});

test('authors do not increment views on their own posts', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'views_count' => 0,
    ]);

    $this->actingAs($author)
        ->get(route('social.posts.show', $post))
        ->assertSuccessful();

    expect(PostView::query()->where('post_id', $post->id)->exists())->toBeFalse();
    expect($post->fresh()->views_count)->toBe(0);
});

test('club feed impressions count a unique view once per viewer', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'body' => 'Terrace opener',
        'views_count' => 0,
    ]);

    $this->actingAs($viewer)
        ->get('/social/feed')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Feed')
            ->where('feed.posts.0.views_count', 1));

    expect($post->fresh()->views_count)->toBe(1);

    $this->actingAs($viewer)
        ->get('/social/feed')
        ->assertSuccessful();

    expect($post->fresh()->views_count)->toBe(1);
});

test('fans can bookmark and unbookmark a post', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
    ]);

    $this->actingAs($viewer)
        ->post(route('social.posts.bookmark', $post))
        ->assertRedirect();

    expect(PostBookmark::query()->where('post_id', $post->id)->where('user_id', $viewer->id)->exists())->toBeTrue();

    $this->actingAs($viewer)
        ->get('/social/feed')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('feed.posts.0.bookmarked_by_viewer', true));

    $this->actingAs($viewer)
        ->delete(route('social.posts.unbookmark', $post))
        ->assertRedirect();

    expect(PostBookmark::query()->where('post_id', $post->id)->where('user_id', $viewer->id)->exists())->toBeFalse();
});

test('not interested hides a post from the club feed and interested restores it', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'body' => 'Rival chatter',
    ]);

    $this->actingAs($viewer)
        ->post(route('social.posts.not-interested', $post))
        ->assertRedirect();

    expect(PostHide::query()->where('post_id', $post->id)->where('user_id', $viewer->id)->exists())->toBeTrue();

    $this->actingAs($viewer)
        ->get('/social/feed')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Feed')
            ->has('feed.posts', 0));

    $this->actingAs($viewer)
        ->delete(route('social.posts.interested', $post))
        ->assertRedirect();

    expect(PostHide::query()->where('post_id', $post->id)->where('user_id', $viewer->id)->exists())->toBeFalse();

    $this->actingAs($viewer)
        ->get('/social/feed')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('feed.posts', 1)
            ->where('feed.posts.0.body', 'Rival chatter'));
});

test('fans cannot mark their own posts as not interested', function () {
    $user = socialReadyUser();
    $post = Post::factory()->create([
        'author_id' => $user->id,
        'club_id' => $user->favourite_club_id,
    ]);

    $this->actingAs($user)
        ->post(route('social.posts.not-interested', $post))
        ->assertForbidden();
});

test('feed post payload exposes follow bookmark and engagement fields for the menu', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'likes_count' => 2,
        'replies_count' => 3,
        'reposts_count' => 1,
        'views_count' => 4,
    ]);

    $this->actingAs($viewer)
        ->post(route('social.users.follow', $author))
        ->assertRedirect();

    $this->actingAs($viewer)
        ->get('/social/feed')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('feed.posts.0.id', $post->id)
            ->where('feed.posts.0.viewer_follows_author', true)
            ->where('feed.posts.0.can_follow_author', true)
            ->where('feed.posts.0.can_hide', true)
            ->where('feed.posts.0.is_own', false)
            ->where('feed.posts.0.likes_count', 2)
            ->where('feed.posts.0.replies_count', 3)
            ->where('feed.posts.0.reposts_count', 1)
            ->where('feed.posts.0.views_count', 5)); // feed impression + prior 4
});
