<?php

use App\Models\Club;
use App\Models\Fandom;
use App\Services\Social\FanLeaderboardService;

test('social leaderboard requires authentication', function () {
    $this->get('/social/leaderboard')->assertRedirect(route('login'));
});

test('leaderboard ranks fans by points and flags the viewer', function () {
    $club = Club::factory()->create(['name' => 'Leader FC']);
    $viewer = socialReadyUser($club);
    $viewer->forceFill(['total_points' => 120, 'current_streak_days' => 10, 'best_streak_days' => 12])->save();

    $topFan = createUser(['handle' => 'topfan']);
    $topFan->forceFill(['total_points' => 500, 'current_streak_days' => 30, 'best_streak_days' => 90])->save();

    $lowFan = createUser(['handle' => 'lowfan']);
    $lowFan->forceFill(['total_points' => 40])->save();

    $this->actingAs($viewer)
        ->get(route('social.leaderboard'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Leaderboard/Index')
            ->where('total_fans', 3)
            ->has('entries', 3)
            ->where('entries.0.points', 500)
            ->where('entries.0.rank', 1)
            ->where('entries.0.fan.handle', 'topfan')
            ->has('entries.0.loyalty.score')
            ->where('entries.1.points', 120)
            ->where('entries.1.rank', 2)
            ->where('entries.1.is_you', true)
            ->where('entries.2.points', 40)
            ->where('entries.2.is_you', false)
            ->has('current_user')
            ->where('current_user.is_you', true)
            ->where('current_user.rank', 2));
});

test('leaderboard scopes to a single club and excludes other clubs fans', function () {
    $home = Club::factory()->create(['name' => 'Home FC']);
    $away = Club::factory()->create(['name' => 'Away FC']);

    $viewer = socialReadyUser($home);
    $viewer->forceFill(['total_points' => 100])->save();

    $clubmate = socialReadyUser($home);
    $clubmate->forceFill(['total_points' => 200])->save();

    $rival = socialReadyUser($away);
    $rival->forceFill(['total_points' => 900])->save();

    $this->actingAs($viewer)
        ->get('/social/leaderboard?scope=club&club_id='.$home->id)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Leaderboard/Index')
            ->where('scope', 'club')
            ->where('club.id', $home->id)
            ->where('total_fans', 2)
            ->has('entries', 2)
            ->where('entries.0.fan.id', $clubmate->id)
            ->where('entries.1.fan.id', $viewer->id));
});

test('leaderboard club scope defaults to the viewer own favourite club', function () {
    $club = Club::factory()->create(['name' => 'Mine FC']);
    $viewer = socialReadyUser($club);

    $this->actingAs($viewer)
        ->get('/social/leaderboard?scope=club')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('scope', 'club')
            ->where('club.id', $club->id));
});

test('leaderboard scopes to a fandom and excludes fans of other fandoms', function () {
    $viewer = socialReadyUser();
    $viewer->forceFill(['total_points' => 50])->save();

    $otherFandom = Fandom::query()->create(['name' => 'Basketball', 'slug' => 'basketball', 'is_active' => true]);
    $otherFandomFan = createUser(['favourite_fandom_id' => $otherFandom->id, 'total_points' => 999]);

    $this->actingAs($viewer)
        ->get('/social/leaderboard?scope=fandom&fandom_id='.$viewer->favourite_fandom_id)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('scope', 'fandom')
            ->has('entries', 1)
            ->where('entries.0.fan.id', $viewer->id));
});

test('leaderboard falls back to global when an invalid club id is requested', function () {
    $viewer = socialReadyUser();

    $this->actingAs($viewer)
        ->get('/social/leaderboard?scope=club&club_id=999999')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->where('scope', 'global'));
});

test('leaderboard surfaces the viewer standing when they fall outside the board', function () {
    $viewer = createUser(['handle' => 'me']);
    $viewer->forceFill(['total_points' => 5])->save();

    createUser()->forceFill(['total_points' => 900])->save();
    createUser()->forceFill(['total_points' => 800])->save();

    $board = app(FanLeaderboardService::class)->present($viewer->fresh(), limit: 2);

    expect($board['entries'])->toHaveCount(2)
        ->and($board['total_fans'])->toBe(3)
        ->and($board['current_user'])->not->toBeNull()
        ->and($board['current_user']['rank'])->toBe(3)
        ->and($board['current_user']['is_you'])->toBeTrue()
        ->and(collect($board['entries'])->pluck('is_you')->every(fn ($flag) => $flag === false))->toBeTrue();
});
