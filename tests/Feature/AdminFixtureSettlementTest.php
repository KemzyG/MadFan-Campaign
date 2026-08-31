<?php

use App\Enums\MatchStatus;
use App\Models\MatchFixture;
use App\Models\Prediction;

/**
 * Two admin surfaces can write a fixture's final score: the Filament
 * MatchFixtureResource (EditMatchFixture::afterSave) and this bespoke
 * FixturesController. Only the Filament path used to settle the linked
 * prediction — this locks in that FixturesController::update() does the
 * same, so a match settled through either admin panel actually pays out.
 */
test('settling a fixture through the admin fixtures api resolves its prediction and pays the winner', function () {
    $admin = createAdminUser();
    $winner = socialReadyUser();
    $loser = socialReadyUser();

    $fixture = MatchFixture::factory()->upcoming()->create();
    $prediction = Prediction::create([
        'match_fixture_id' => $fixture->id,
        'closes_at' => $fixture->kickoff_at,
        'points_reward' => 20,
    ]);

    app(App\Services\Social\PredictionService::class)->vote($winner, $prediction, 'home');
    app(App\Services\Social\PredictionService::class)->vote($loser, $prediction, 'away');

    $winnerPointsBefore = $winner->total_points;

    $this->actingAs($admin)
        ->putJson(route('admin.api.fixtures.update', $fixture), [
            'status' => MatchStatus::Finished->value,
            'home_score' => 3,
            'away_score' => 1,
        ])
        ->assertSuccessful();

    $prediction->refresh();

    expect($prediction->resolved_at)->not->toBeNull()
        ->and($prediction->correct_choice)->toBe('home')
        ->and($winner->fresh()->total_points)->toBe($winnerPointsBefore + 20)
        ->and($loser->fresh()->total_points)->toBe($loser->total_points);
});

test('settling a fixture through the admin fixtures api twice does not double-pay', function () {
    $admin = createAdminUser();
    $winner = socialReadyUser();

    $fixture = MatchFixture::factory()->upcoming()->create();
    $prediction = Prediction::create([
        'match_fixture_id' => $fixture->id,
        'closes_at' => $fixture->kickoff_at,
        'points_reward' => 20,
    ]);

    app(App\Services\Social\PredictionService::class)->vote($winner, $prediction, 'home');

    $update = [
        'status' => MatchStatus::Finished->value,
        'home_score' => 2,
        'away_score' => 0,
    ];

    $this->actingAs($admin)->putJson(route('admin.api.fixtures.update', $fixture), $update)->assertSuccessful();
    $pointsAfterFirstSettle = $winner->fresh()->total_points;

    $this->actingAs($admin)->putJson(route('admin.api.fixtures.update', $fixture), $update)->assertSuccessful();

    expect($winner->fresh()->total_points)->toBe($pointsAfterFirstSettle);
});

/**
 * The admin Predictions panel lets staff set `correct_choice` directly (for
 * a fixture whose score never synced, or any other case the auto-resolve
 * path missed) — but a plain `$prediction->update(['correct_choice' => ...])`
 * used to mark it resolved without ever scoring a guess or paying a point.
 */
test('manually settling a prediction through the admin predictions api pays the winner', function () {
    $admin = createAdminUser();
    $winner = socialReadyUser();
    $loser = socialReadyUser();

    $fixture = MatchFixture::factory()->upcoming()->create();
    $prediction = Prediction::create([
        'match_fixture_id' => $fixture->id,
        'closes_at' => $fixture->kickoff_at,
        'points_reward' => 15,
    ]);

    app(App\Services\Social\PredictionService::class)->vote($winner, $prediction, 'away');
    app(App\Services\Social\PredictionService::class)->vote($loser, $prediction, 'draw');

    $winnerPointsBefore = $winner->total_points;

    $this->actingAs($admin)
        ->putJson(route('admin.api.predictions.update', $prediction), ['correct_choice' => 'away'])
        ->assertSuccessful();

    $prediction->refresh();

    expect($prediction->resolved_at)->not->toBeNull()
        ->and($prediction->correct_choice)->toBe('away')
        ->and($winner->fresh()->total_points)->toBe($winnerPointsBefore + 15)
        ->and($loser->fresh()->total_points)->toBe($loser->total_points);
});
