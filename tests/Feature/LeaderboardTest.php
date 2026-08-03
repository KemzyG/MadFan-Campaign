<?php

use App\Models\User;
use Database\Seeders\SeasonSeeder;

test('authenticated users can view the live leaderboard', function () {
    $this->seed(SeasonSeeder::class);

    $leader = createUser(['total_points' => 5000, 'name' => 'Leader Fan', 'email' => 'leader@madfan.test']);
    $viewer = createUser(['total_points' => 100, 'name' => 'Viewer Fan']);

    $response = $this->withHeaders(pasetoHeaders($viewer))
        ->getJson('/api/leaderboard?limit=10');

    $response->assertSuccessful()
        ->assertJsonPath('entries.0.user.email_masked', 'l****r@madfan.test')
        ->assertJsonPath('entries.0.user.name', null)
        ->assertJsonPath('current_user.rank', 2)
        ->assertJsonPath('current_user.user.name', $viewer->name)
        ->assertJsonPath('total_users', User::query()->fanAccounts()->count());
});

test('admins are excluded from the live leaderboard', function () {
    $this->seed(SeasonSeeder::class);

    $admin = createAdminUser(['total_points' => 99999, 'name' => 'Admin Leader', 'email' => 'admin-leader@madfan.test']);
    $fanLeader = createUser(['total_points' => 500, 'name' => 'Fan Leader', 'email' => 'fan-leader@madfan.test']);
    $viewer = createUser(['total_points' => 50, 'name' => 'Viewer Fan']);

    $response = $this->withHeaders(pasetoHeaders($viewer))
        ->getJson('/api/leaderboard?limit=10');

    $response->assertSuccessful()
        ->assertJsonPath('entries.0.user.id', $fanLeader->id)
        ->assertJsonPath('current_user.rank', 2)
        ->assertJsonPath('total_users', 2);

    $entryIds = collect($response->json('entries'))->pluck('user.id');
    expect($entryIds)->not->toContain($admin->id);
});

test('leaderboard respects the limit parameter', function () {
    createUser(['total_points' => 300]);
    createUser(['total_points' => 200]);
    createUser(['total_points' => 100]);
    $viewer = createUser(['total_points' => 0]);

    $response = $this->withHeaders(pasetoHeaders($viewer))
        ->getJson('/api/leaderboard?limit=2');

    $response->assertSuccessful();
    expect($response->json('entries'))->toHaveCount(2);
});

test('guests cannot access the leaderboard', function () {
    $this->getJson('/api/leaderboard')->assertUnauthorized();
});
