<?php

use App\Models\Club;
use App\Models\League;
use App\Models\LeagueStanding;
use Database\Seeders\ClubSeeder;
use Database\Seeders\LeagueStandingSeeder;

test('social clubs standings page requires authentication', function () {
    $this->get('/social/clubs')->assertRedirect(route('login'));
});

test('clubs page shows league standings ordered by points', function () {
    $league = League::factory()->create(['name' => 'Test League', 'short' => 'TST']);
    $leader = Club::factory()->create(['league_id' => $league->id, 'name' => 'Alpha FC', 'short' => 'ALP']);
    $runnerUp = Club::factory()->create(['league_id' => $league->id, 'name' => 'Beta FC', 'short' => 'BET']);
    $user = socialReadyUser($leader);

    LeagueStanding::factory()->create([
        'league_id' => $league->id,
        'club_id' => $runnerUp->id,
        'played' => 10,
        'won' => 6,
        'drawn' => 2,
        'lost' => 2,
        'goals_for' => 18,
        'goals_against' => 10,
        'points' => 20,
    ]);

    LeagueStanding::factory()->create([
        'league_id' => $league->id,
        'club_id' => $leader->id,
        'played' => 10,
        'won' => 8,
        'drawn' => 1,
        'lost' => 1,
        'goals_for' => 22,
        'goals_against' => 8,
        'points' => 25,
    ]);

    $this->actingAs($user)
        ->get('/social/clubs?league_id='.$league->id)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Clubs')
            ->where('filters.league_id', $league->id)
            ->where('table.league.name', 'Test League')
            ->has('table.rows', 2)
            ->where('table.rows.0.club.short', 'ALP')
            ->where('table.rows.0.position', 1)
            ->where('table.rows.0.points', 25)
            ->where('table.rows.0.goal_difference', 14)
            ->where('table.rows.0.is_favourite', true)
            ->where('table.rows.1.club.short', 'BET')
            ->where('table.rows.1.position', 2));
});

test('clubs page defaults to favourite club league when no filter is provided', function () {
    $league = League::factory()->create(['name' => 'Fan League', 'short' => 'FAN']);
    $club = Club::factory()->create(['league_id' => $league->id, 'name' => 'Fan FC', 'short' => 'FFC']);
    $user = socialReadyUser($club);

    LeagueStanding::factory()->create([
        'league_id' => $league->id,
        'club_id' => $club->id,
        'played' => 5,
        'won' => 3,
        'drawn' => 1,
        'lost' => 1,
        'goals_for' => 9,
        'goals_against' => 4,
        'points' => 10,
    ]);

    $this->actingAs($user)
        ->get('/social/clubs')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Clubs')
            ->where('filters.league_id', $league->id)
            ->where('table.rows.0.club.short', 'FFC'));
});

test('league standing seeder creates rows for all catalogue clubs', function () {
    $this->seed([
        ClubSeeder::class,
        LeagueStandingSeeder::class,
    ]);

    expect(LeagueStanding::query()->count())->toBe(30);
});
