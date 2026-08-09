<?php

use App\Actions\Social\AwardSocialPoints;
use App\Enums\PostType;
use App\Models\Club;
use App\Models\Follow;
use App\Models\PointTransaction;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\SocialReport;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

test('fans can follow users and see following feed', function () {
    $club = Club::factory()->create();
    $viewer = socialReadyUser($club);
    $followed = socialReadyUser($club);
    $stranger = socialReadyUser($club);

    Post::factory()->create([
        'author_id' => $followed->id,
        'club_id' => $club->id,
        'body' => 'From followed',
    ]);

    Post::factory()->create([
        'author_id' => $stranger->id,
        'club_id' => $club->id,
        'body' => 'From stranger',
    ]);

    $this->actingAs($viewer)
        ->post(route('social.users.follow', $followed))
        ->assertRedirect();

    expect(Follow::query()->where('follower_id', $viewer->id)->where('following_id', $followed->id)->exists())
        ->toBeTrue();

    $this->actingAs($viewer)
        ->get('/social?mode=following')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Home')
            ->where('feed.mode', 'following')
            ->has('feed.posts', 1)
            ->where('feed.posts.0.body', 'From followed'));
});

test('publishing a post awards social points until the daily cap', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->post('/social/posts', ['body' => 'Goal one'])
        ->assertRedirect();

    expect((int) $user->fresh()->total_points)->toBe(AwardSocialPoints::RULES[AwardSocialPoints::SOURCE_POST]['points']);

    expect(PointTransaction::query()
        ->where('user_id', $user->id)
        ->where('source_type', AwardSocialPoints::SOURCE_POST)
        ->count())->toBe(1);

    $this->actingAs($user)->post('/social/posts', ['body' => 'Goal two']);
    $this->actingAs($user)->post('/social/posts', ['body' => 'Goal three']);
    $this->actingAs($user)->post('/social/posts', ['body' => 'Goal four capped']);

    expect(PointTransaction::query()
        ->where('user_id', $user->id)
        ->where('source_type', AwardSocialPoints::SOURCE_POST)
        ->count())->toBe(3);
});

test('AwardSocialPoints inserts social_post source_type on sqlite without check failures', function () {
    expect(DB::connection()->getDriverName())->toBe('sqlite');

    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $post = Post::factory()->create([
        'author_id' => $user->id,
        'club_id' => $club->id,
        'body' => 'SQLite source_type check',
    ]);

    $transaction = app(AwardSocialPoints::class)->forPost($user, $post->id);

    expect($transaction)->not->toBeNull()
        ->and($transaction->source_type)->toBe(AwardSocialPoints::SOURCE_POST)
        ->and((int) $user->fresh()->total_points)->toBe(AwardSocialPoints::RULES[AwardSocialPoints::SOURCE_POST]['points']);

    $this->assertDatabaseHas('point_transactions', [
        'user_id' => $user->id,
        'source_type' => AwardSocialPoints::SOURCE_POST,
        'source_id' => (string) $post->id,
        'amount' => AwardSocialPoints::RULES[AwardSocialPoints::SOURCE_POST]['points'],
    ]);
});

test('meaningful replies award reply points and short replies do not', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $replier = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'body' => 'Open banter',
    ]);

    $this->actingAs($replier)
        ->post(route('social.posts.replies.store', $post), ['body' => 'short'])
        ->assertRedirect();

    expect(PointTransaction::query()
        ->where('user_id', $replier->id)
        ->where('source_type', AwardSocialPoints::SOURCE_REPLY)
        ->count())->toBe(0);

    $this->actingAs($replier)
        ->post(route('social.posts.replies.store', $post), ['body' => str_repeat('a', 20)])
        ->assertRedirect();

    expect(PointTransaction::query()
        ->where('user_id', $replier->id)
        ->where('source_type', AwardSocialPoints::SOURCE_REPLY)
        ->count())->toBe(1);
});

test('likes award the author when received from another fan', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'body' => 'Like this',
    ]);

    $start = (int) $author->total_points;

    $this->actingAs($viewer)
        ->post(route('social.posts.like', $post))
        ->assertRedirect();

    expect((int) $author->fresh()->total_points)->toBe($start + 1);
});

test('reporting a post hides it from the reporter feed', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'body' => 'Spam take',
    ]);

    $this->actingAs($viewer)
        ->post(route('social.posts.report', $post), ['reason' => 'spam'])
        ->assertRedirect(route('social.home'));

    expect(SocialReport::query()->where('reporter_id', $viewer->id)->where('target_id', $post->id)->exists())
        ->toBeTrue();

    $this->actingAs($viewer)
        ->get('/social')
        ->assertInertia(fn ($page) => $page->has('feed.posts', 0));
});

test('fans can repost and quote another post', function () {
    $club = Club::factory()->create();
    $author = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    $post = Post::factory()->create([
        'author_id' => $author->id,
        'club_id' => $club->id,
        'body' => 'Original take',
    ]);

    $this->actingAs($viewer)
        ->post(route('social.posts.repost', $post))
        ->assertRedirect(route('social.home'));

    expect(Post::query()->where('type', PostType::Repost)->where('repost_of_id', $post->id)->exists())->toBeTrue();
    expect($post->fresh()->reposts_count)->toBe(1);

    $this->actingAs($viewer)
        ->post(route('social.posts.quote', $post), ['body' => 'Adding heat'])
        ->assertRedirect(route('social.home'));

    expect(Post::query()->where('type', PostType::Quote)->where('quote_of_id', $post->id)->where('body', 'Adding heat')->exists())
        ->toBeTrue();
    expect($post->fresh()->quotes_count)->toBe(1);
});

test('social profile shows posts and follow controls', function () {
    $club = Club::factory()->create();
    $profile = socialReadyUser($club);
    $viewer = socialReadyUser($club);

    Post::factory()->create([
        'author_id' => $profile->id,
        'club_id' => $club->id,
        'body' => 'Profile post',
    ]);

    $this->actingAs($viewer)
        ->get(route('social.profile', $profile->handle))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Profile')
            ->where('profile.handle', $profile->handle)
            ->where('profile.is_following', false)
            ->has('feed.posts', 1));
});

test('fans can attach images to a post', function () {
    Storage::fake('public');

    $user = socialReadyUser();
    $image = UploadedFile::fake()->create('terrace.jpg', 120, 'image/jpeg');

    $this->actingAs($user)
        ->post('/social/posts', [
            'body' => 'Matchday photo',
            'images' => [$image],
        ])
        ->assertRedirect(route('social.home'));

    $post = Post::query()->latest('id')->first();

    expect($post)->not->toBeNull()
        ->and(PostMedia::query()->where('post_id', $post->id)->count())->toBe(1);

    $media = PostMedia::query()->where('post_id', $post->id)->first();
    Storage::disk('public')->assertExists($media->path);
});
