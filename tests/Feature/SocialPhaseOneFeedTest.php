<?php

use App\Models\Club;
use App\Models\Post;
use App\Models\PostLike;

test('global feed lists top-level posts across clubs', function () {
    $club = Club::factory()->create(['name' => 'Home United']);
    $otherClub = Club::factory()->create();
    $user = socialReadyUser($club);
    $otherFan = socialReadyUser($otherClub);

    Post::factory()->create([
        'author_id' => $user->id,
        'club_id' => $club->id,
        'body' => 'Kickoff vibes',
    ]);

    Post::factory()->create([
        'author_id' => $otherFan->id,
        'club_id' => $otherClub->id,
        'body' => 'Away terrace',
    ]);

    $replyParent = Post::factory()->create([
        'author_id' => $user->id,
        'club_id' => $club->id,
        'body' => 'Parent',
    ]);

    Post::factory()->reply($replyParent)->create([
        'author_id' => $user->id,
        'body' => 'Nested reply should not list on home',
    ]);

    $this->actingAs($user)
        ->get('/social/feed')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Feed')
            ->where('feed.mode', 'global')
            ->has('feed.posts', 3)
            ->where('feed.posts.0.body', 'Parent')
            ->where('feed.posts.1.body', 'Away terrace')
            ->where('feed.posts.2.body', 'Kickoff vibes')
            ->where('feed.posts.0.author.avatar_url', $user->avatar_url));
});

test('legacy club mode query still resolves to the global feed', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->get('/social/feed?mode=club')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Feed')
            ->where('feed.mode', 'global'));
});

test('onboarded fans can create a text post on the club terrace', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->post('/social/posts', ['body' => 'First ball in.'])
        ->assertRedirect(route('social.feed'));

    $post = Post::query()->first();

    expect($post)->not->toBeNull()
        ->and($post->body)->toBe('First ball in.')
        ->and($post->author_id)->toBe($user->id)
        ->and($post->club_id)->toBe($user->favourite_club_id)
        ->and($post->reply_to_id)->toBeNull();
});

test('post body longer than 280 characters is rejected', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->post('/social/posts', ['body' => str_repeat('a', 281)])
        ->assertSessionHasErrors('body');
});

test('fans can like and unlike a post', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'body' => 'Like me',
    ]);

    $this->actingAs($viewer)
        ->post(route('social.posts.like', $post))
        ->assertRedirect();

    expect(PostLike::query()->where('post_id', $post->id)->where('user_id', $viewer->id)->exists())->toBeTrue();
    expect($post->fresh()->likes_count)->toBe(1);

    $this->actingAs($viewer)
        ->delete(route('social.posts.unlike', $post))
        ->assertRedirect();

    expect(PostLike::query()->where('post_id', $post->id)->where('user_id', $viewer->id)->exists())->toBeFalse();
    expect($post->fresh()->likes_count)->toBe(0);
});

test('fans can reply and read the thread', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $replier = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'body' => 'Open banter',
    ]);

    $this->actingAs($replier)
        ->post(route('social.posts.replies.store', $post), ['body' => 'Standing ovation'])
        ->assertRedirect(route('social.posts.show', $post));

    $reply = Post::query()->where('reply_to_id', $post->id)->first();

    expect($reply)->not->toBeNull()
        ->and($reply->root_id)->toBe($post->id)
        ->and($post->fresh()->replies_count)->toBe(1);

    $this->actingAs($replier)
        ->get(route('social.posts.show', $post))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/PostShow')
            ->where('post.body', 'Open banter')
            ->has('replies', 1)
            ->where('replies.0.body', 'Standing ovation'));
});

test('authors can soft-delete their own posts', function () {
    $user = socialReadyUser();
    $post = Post::factory()->create([
        'author_id' => $user->id,
        'club_id' => $user->favourite_club_id,
        'body' => 'Wrong take',
    ]);

    $this->actingAs($user)
        ->delete(route('social.posts.destroy', $post))
        ->assertRedirect(route('social.feed'));

    expect(Post::query()->find($post->id))->toBeNull()
        ->and(Post::withTrashed()->find($post->id))->not->toBeNull();
});
