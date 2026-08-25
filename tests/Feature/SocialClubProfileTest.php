<?php

use App\Models\Club;
use App\Models\League;
use App\Models\LeagueStanding;

test('social club profile requires authentication and onboarding gates', function () {
    $club = Club::factory()->create();

    $this->get("/social/clubs/{$club->id}")->assertRedirect(route('login'));
});

test('club profile shows the season standing, member count and top fans', function () {
    $league = League::factory()->create(['name' => 'Test League']);
    $club = Club::factory()->create(['league_id' => $league->id, 'name' => 'Alpha FC', 'short' => 'ALP']);
    $rival = Club::factory()->create(['league_id' => $league->id, 'name' => 'Beta FC']);

    LeagueStanding::factory()->create([
        'league_id' => $league->id,
        'club_id' => $club->id,
        'played' => 10,
        'won' => 8,
        'drawn' => 1,
        'lost' => 1,
        'goals_for' => 22,
        'goals_against' => 8,
        'points' => 25,
    ]);

    LeagueStanding::factory()->create([
        'league_id' => $league->id,
        'club_id' => $rival->id,
        'points' => 10,
    ]);

    $user = socialReadyUser($club);
    $user->forceFill(['total_points' => 500])->save();

    $otherFan = socialReadyUser($club);
    $otherFan->forceFill(['total_points' => 100])->save();

    $this->actingAs($user)
        ->get("/social/clubs/{$club->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Clubs/Show')
            ->where('club.name', 'Alpha FC')
            ->where('standing.row.club.short', 'ALP')
            ->where('standing.row.position', 1)
            ->where('standing.total_clubs', 2)
            ->where('member_count', 2)
            ->where('is_favourite', true)
            ->has('top_fans', 2)
            ->where('top_fans.0.fan.id', $user->id)
            ->where('top_fans.0.points', 500)
            ->where('top_fans.0.rank', 1));
});

test('club profile handles a club with no standings yet', function () {
    $club = Club::factory()->create(['name' => 'No Table FC']);
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->get("/social/clubs/{$club->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Clubs/Show')
            ->where('club.name', 'No Table FC')
            ->where('standing', null)
            ->where('member_count', 1)
            ->where('top_fans.0.fan.id', $user->id));
});
