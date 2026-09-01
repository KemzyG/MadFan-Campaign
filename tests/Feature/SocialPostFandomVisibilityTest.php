<?php

use App\Actions\Social\CreateSocialPost;
use App\Enums\PostVisibility;
use App\Models\Fandom;
use App\Models\User;
use App\Services\Social\FeedService;
use App\Support\ApplicationSettings;

function fandomOnlyPostUser(): User
{
    ApplicationSettings::sync(['social_network_enabled' => 'true']);
    $fandom = ensureRegistrationFandom();

    return createUser([
        'email_verified_at' => now(),
        'favourite_fandom_id' => $fandom->id,
        'favourite_club_id' => null,
        'social_onboarded_at' => now(),
        'handle' => 'fan'.fake()->unique()->numerify('######'),
    ]);
}

test('posting requires a favourite fandom, not a club', function () {
    $user = createUser([
        'email_verified_at' => now(),
        'favourite_fandom_id' => null,
        'social_onboarded_at' => now(),
    ]);

    expect(fn () => app(CreateSocialPost::class)->handle($user, ['body' => 'Hello']))
        ->toThrow(InvalidArgumentException::class, 'Favourite fandom is required before posting.');
});

test('a fandom-only fan can post, and the post stamps their fandom_id', function () {
    $user = fandomOnlyPostUser();

    $post = app(CreateSocialPost::class)->handle($user, ['body' => 'Kickoff soon.', 'visibility' => 'fandom']);

    expect($post->fandom_id)->toBe($user->favourite_fandom_id)
        ->and($post->club_id)->toBeNull()
        ->and($post->visibility)->toBe(PostVisibility::Fandom);
});

test('a fandom-visibility post is visible to fellow fandom members but not outsiders or guests', function () {
    $author = fandomOnlyPostUser();
    $fellow = fandomOnlyPostUser();

    $otherFandom = Fandom::query()->create(['name' => 'Cricket', 'slug' => 'cricket-'.fake()->unique()->numerify('####'), 'is_active' => true]);
    $outsider = createUser([
        'email_verified_at' => now(),
        'favourite_fandom_id' => $otherFandom->id,
        'social_onboarded_at' => now(),
    ]);

    $post = app(CreateSocialPost::class)->handle($author, ['body' => 'Fandom-only take.', 'visibility' => 'fandom']);

    $feed = app(FeedService::class);

    expect($feed->canView($fellow, $post))->toBeTrue()
        ->and($feed->canView($author, $post))->toBeTrue()
        ->and($feed->canView($outsider, $post))->toBeFalse()
        ->and($feed->canView(null, $post))->toBeFalse();
});

test('the global feed only surfaces a fandom-visibility post to the right audience', function () {
    $author = fandomOnlyPostUser();
    $fellow = fandomOnlyPostUser();

    $post = app(CreateSocialPost::class)->handle($author, ['body' => 'Fandom-only take.', 'visibility' => 'fandom']);

    $feed = app(FeedService::class);

    expect($feed->globalFeed($fellow)->pluck('id'))->toContain($post->id)
        ->and($feed->globalFeed(null)->pluck('id'))->not->toContain($post->id);
});
