<?php

use App\Models\Club;
use App\Models\User;
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
