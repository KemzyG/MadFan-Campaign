<?php

use App\Enums\MatchStatus;
use App\Models\Club;
use App\Models\MatchFixture;
use Illuminate\Support\Carbon;

test('social fixtures page requires authentication', function () {
    $this->get('/social/fixtures')->assertRedirect(route('login'));
});

test('fixtures board groups live today coming and past matches', function () {
    Carbon::setTestNow(Carbon::parse('2026-08-21 14:00:00'));

    $clubA = Club::factory()->create(['name' => 'North FC', 'short' => 'NOR']);
    $clubB = Club::factory()->create(['name' => 'South FC', 'short' => 'SOU']);
    $clubC = Club::factory()->create(['name' => 'East FC', 'short' => 'EAS']);
    $clubD = Club::factory()->create(['name' => 'West FC', 'short' => 'WES']);
    $user = socialReadyUser($clubA);

    MatchFixture::factory()->live()->create([
        'home_club_id' => $clubA->id,
        'away_club_id' => $clubB->id,
        'venue' => 'North Park',
        'competition' => 'Friendly',
        'kickoff_at' => now()->subMinutes(30),
    ]);

    MatchFixture::factory()->create([
        'home_club_id' => $clubB->id,
        'away_club_id' => $clubC->id,
        'venue' => 'South Ground',
        'status' => MatchStatus::Upcoming,
        'kickoff_at' => now()->setTime(20, 0),
        'competition' => 'League',
        'price' => '30.00',
    ]);

    MatchFixture::factory()->create([
        'home_club_id' => $clubC->id,
        'away_club_id' => $clubD->id,
        'venue' => 'East Arena',
        'status' => MatchStatus::Upcoming,
        'kickoff_at' => now()->addDays(3)->setTime(15, 0),
        'competition' => 'Cup',
        'price' => '35.00',
    ]);

    MatchFixture::factory()->finished()->create([
        'home_club_id' => $clubD->id,
        'away_club_id' => $clubA->id,
        'venue' => 'West Bowl',
        'competition' => 'League',
        'kickoff_at' => now()->subDays(3)->setTime(15, 0),
    ]);

    $this->actingAs($user)
        ->get('/social/fixtures')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Fixtures')
            ->where('tab', 'all')
            ->has('board.live', 1)
            ->has('board.today', 1)
            ->has('board.coming', 1)
            ->has('board.past', 1)
            ->where('board.counts.live', 1)
            ->where('board.counts.today', 1)
            ->where('board.counts.coming', 1)
            ->where('board.counts.past', 1)
            ->where('board.coming.0.matches.0.venue', 'East Arena')
            ->where('board.live.0.status', 'live'));

    Carbon::setTestNow();
});

test('fixtures tab query filters the active board section', function () {
    $user = socialReadyUser();

    MatchFixture::factory()->live()->create();

    $this->actingAs($user)
        ->get('/social/fixtures?tab=live')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Fixtures')
            ->where('tab', 'live')
            ->has('board.live', 1));
});
