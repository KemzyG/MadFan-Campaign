<?php

use App\Enums\MatchStatus;
use App\Models\Fandom;
use App\Models\FandomFollow;
use App\Models\MatchFixture;
use App\Models\Poll;
use App\Models\PollOption;
use App\Models\Prediction;
use App\Services\Social\PredictionService;

test('fandom hub page requires authentication', function () {
    $this->get('/social/fandom/football')->assertRedirect(route('login'));
});

test('fandom hub home tab renders header, pulse, and every home section', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->get('/social/fandom/football')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Fandom/Index')
            ->where('tab', 'home')
            ->has('fandom.name')
            ->has('fandom.fan_count')
            ->has('fandom.icon')
            ->where('fandom.is_following', true)
            ->has('home.pulse')
            ->has('home.challenges')
            ->has('home.predictions')
            ->has('home.polls')
            ->has('home.feed.posts')
            ->has('home.leaderboard.entries')
            ->has('home.upcoming'));
});

test('fandom hub auto-generates a prediction for every upcoming fixture', function () {
    $user = socialReadyUser();
    $fixture = MatchFixture::factory()->upcoming()->create();

    expect(Prediction::where('match_fixture_id', $fixture->id)->exists())->toBeFalse();

    $this->actingAs($user)->get('/social/fandom/football')->assertSuccessful();

    expect(Prediction::where('match_fixture_id', $fixture->id)->exists())->toBeTrue();
});

test('a fan can vote on a prediction and it shows their choice', function () {
    $user = socialReadyUser();
    $fixture = MatchFixture::factory()->upcoming()->create();
    $prediction = Prediction::create([
        'match_fixture_id' => $fixture->id,
        'closes_at' => $fixture->kickoff_at,
    ]);

    $this->actingAs($user)
        ->postJson(route('api.social.predictions.vote', $prediction), ['choice' => 'home'])
        ->assertSuccessful()
        ->assertJsonPath('prediction.my_choice', 'home');
});

test('resolving a prediction awards points to correct guesses only, exactly once', function () {
    $winner = socialReadyUser();
    $loser = socialReadyUser();
    $fixture = MatchFixture::factory()->upcoming()->create();
    $prediction = Prediction::create([
        'match_fixture_id' => $fixture->id,
        'closes_at' => $fixture->kickoff_at,
        'points_reward' => 20,
    ]);

    app(PredictionService::class)->vote($winner, $prediction, 'home');
    app(PredictionService::class)->vote($loser, $prediction, 'away');

    $winnerPointsBefore = $winner->total_points;

    $fixture->update(['status' => MatchStatus::Finished, 'home_score' => 3, 'away_score' => 1]);
    app(PredictionService::class)->resolve($prediction->fresh());

    expect($winner->fresh()->total_points)->toBe($winnerPointsBefore + 20)
        ->and($loser->fresh()->total_points)->toBe($loser->total_points);

    // resolving again must not double-award
    app(PredictionService::class)->resolve($prediction->fresh());
    expect($winner->fresh()->total_points)->toBe($winnerPointsBefore + 20);
});

test('predictions close once the fixture kicks off', function () {
    $user = socialReadyUser();
    $fixture = MatchFixture::factory()->create(['kickoff_at' => now()->subMinutes(5), 'status' => MatchStatus::Live]);
    $prediction = Prediction::create([
        'match_fixture_id' => $fixture->id,
        'closes_at' => $fixture->kickoff_at,
    ]);

    $this->actingAs($user)
        ->postJson(route('api.social.predictions.vote', $prediction), ['choice' => 'home'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('choice');
});

test('a fan can vote on a poll, tally updates, and points award only on first vote', function () {
    $user = socialReadyUser();
    $poll = Poll::create(['question' => 'Best signing?', 'is_active' => true]);
    $a = PollOption::create(['poll_id' => $poll->id, 'label' => 'Player A']);
    $b = PollOption::create(['poll_id' => $poll->id, 'label' => 'Player B']);

    $before = $user->total_points;

    $this->actingAs($user)
        ->postJson(route('api.social.polls.vote', $poll), ['option_id' => $a->id])
        ->assertSuccessful()
        ->assertJsonPath('poll.my_option_id', $a->id)
        ->assertJsonPath('poll.options.0.votes_count', 1);

    expect($user->fresh()->total_points)->toBeGreaterThan($before);
    $afterFirstVote = $user->fresh()->total_points;

    // changing the vote moves the tally but doesn't award points again
    $this->actingAs($user)
        ->postJson(route('api.social.polls.vote', $poll), ['option_id' => $b->id])
        ->assertSuccessful()
        ->assertJsonPath('poll.my_option_id', $b->id);

    expect(PollOption::find($a->id)->votes_count)->toBe(0)
        ->and(PollOption::find($b->id)->votes_count)->toBe(1)
        ->and($user->fresh()->total_points)->toBe($afterFirstVote);
});

test('a fan can leave and rejoin a fandom, and the fan count reflects it', function () {
    $user = socialReadyUser();
    $fandom = Fandom::query()->where('slug', 'football')->firstOrFail();

    // socialReadyUser() already onboards the fan into their favourite fandom.
    expect($user->isFollowingFandom($fandom))->toBeTrue();
    $before = FandomFollow::where('fandom_id', $fandom->id)->count();

    $this->actingAs($user)
        ->deleteJson(route('api.social.fandoms.unfollow', $fandom))
        ->assertSuccessful()
        ->assertJsonPath('following', false)
        ->assertJsonPath('fan_count', $before - 1);

    expect($user->isFollowingFandom($fandom))->toBeFalse();

    $this->actingAs($user)
        ->postJson(route('api.social.fandoms.follow', $fandom))
        ->assertSuccessful()
        ->assertJsonPath('following', true)
        ->assertJsonPath('fan_count', $before);
});

test('fandom members page lists followers ranked by points', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->get('/social/fandom/football/members')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Fandom/Members')
            ->has('members.data')
            ->has('members.meta.total'));
});

test('fandom hub feed, live, events, and more tabs all render', function () {
    $user = socialReadyUser();

    foreach (['feed', 'live', 'events', 'more'] as $tab) {
        $this->actingAs($user)
            ->get("/social/fandom/football?tab={$tab}")
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Social/Fandom/Index')
                ->where('tab', $tab));
    }
});
