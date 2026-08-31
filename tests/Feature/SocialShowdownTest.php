<?php

use App\Models\PointTransaction;
use App\Models\Showdown;
use App\Models\User;

function makeShowdown(array $overrides = []): Showdown
{
    return Showdown::create([
        'title' => 'Fan Showdown',
        'contestant_a_user_id' => User::factory()->create()->id,
        'contestant_b_user_id' => User::factory()->create()->id,
        ...$overrides,
    ]);
}

test('showdown page requires authentication', function () {
    $showdown = makeShowdown();

    $this->get("/social/showdown/{$showdown->id}")->assertRedirect(route('login'));
});

test('a fan can vote for a side and the tally updates', function () {
    $user = socialReadyUser();
    $showdown = makeShowdown();

    $this->actingAs($user)
        ->get("/social/showdown/{$showdown->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Showdown/Show')
            ->where('showdown.my_side', null)
            ->where('showdown.total_votes', 0));

    $this->actingAs($user)
        ->postJson(route('api.social.showdowns.vote', $showdown), ['side' => 'a'])
        ->assertSuccessful()
        ->assertJsonPath('showdown.my_side', 'a')
        ->assertJsonPath('showdown.my_taps', 1)
        ->assertJsonPath('showdown.contestant_a.votes', 1)
        ->assertJsonPath('showdown.contestant_a.percent', 100);
});

test('tapping the same side again keeps counting — voting is genuinely unlimited', function () {
    $user = socialReadyUser();
    $showdown = makeShowdown();

    foreach (range(1, 15) as $tap) {
        $this->actingAs($user)
            ->postJson(route('api.social.showdowns.vote', $showdown), ['side' => 'a'])
            ->assertSuccessful()
            ->assertJsonPath('showdown.my_taps', $tap);
    }

    expect($showdown->fresh()->votes_a)->toBe(15);
});

test('once a side is picked, voting the other side is rejected', function () {
    $user = socialReadyUser();
    $showdown = makeShowdown();

    $this->actingAs($user)->postJson(route('api.social.showdowns.vote', $showdown), ['side' => 'a'])->assertSuccessful();

    $this->actingAs($user)
        ->postJson(route('api.social.showdowns.vote', $showdown), ['side' => 'b'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('side');

    expect($showdown->fresh())
        ->votes_a->toBe(1)
        ->votes_b->toBe(0);
});

test('voting on a closed showdown is rejected', function () {
    $user = socialReadyUser();
    $showdown = makeShowdown(['is_active' => false]);

    $this->actingAs($user)
        ->postJson(route('api.social.showdowns.vote', $showdown), ['side' => 'a'])
        ->assertUnprocessable();
});

test('showdown votes earn points for only the first ten taps of the day, across all showdowns', function () {
    $user = socialReadyUser();
    $showdownOne = makeShowdown(['title' => 'Showdown One']);
    $showdownTwo = makeShowdown(['title' => 'Showdown Two']);

    foreach (range(1, 6) as $tap) {
        $this->actingAs($user)->postJson(route('api.social.showdowns.vote', $showdownOne), ['side' => 'a'])->assertSuccessful();
    }

    foreach (range(1, 6) as $tap) {
        $this->actingAs($user)->postJson(route('api.social.showdowns.vote', $showdownTwo), ['side' => 'a'])->assertSuccessful();
    }

    expect($user->fresh()->total_points)->toBe(10)
        ->and(PointTransaction::where('user_id', $user->id)->where('source_type', 'social_showdown')->count())->toBe(10);
});

test('two different fans can each back a different side independently', function () {
    $fanA = socialReadyUser();
    $fanB = socialReadyUser();
    $showdown = makeShowdown();

    $this->actingAs($fanA)->postJson(route('api.social.showdowns.vote', $showdown), ['side' => 'a'])->assertSuccessful();
    $this->actingAs($fanB)->postJson(route('api.social.showdowns.vote', $showdown), ['side' => 'b'])->assertSuccessful();

    expect($showdown->fresh())->votes_a->toBe(1)->votes_b->toBe(1);
});

test('open showdowns render as showdown cards on the events feed', function () {
    $user = socialReadyUser();
    makeShowdown(['title' => 'Season MVP Showdown']);

    $this->actingAs($user)
        ->get('/social?type=showdown')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('active_filter', 'showdown')
            ->has('events.data', 1)
            ->where('events.data.0.headline', 'Season MVP Showdown'));
});

test('a fandom hub lists its own open showdowns on the home tab', function () {
    $user = socialReadyUser();
    $fandom = App\Models\Fandom::where('slug', 'football')->first();
    makeShowdown(['fandom_id' => $fandom->id]);

    $this->actingAs($user)
        ->get('/social/fandom/football')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->has('home.showdowns', 1));
});
