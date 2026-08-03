<?php

use App\Enums\PointSourceType;
use App\Models\PointTransaction;
use App\Services\Admin\AdminDashboardDataService;
use App\Services\Analytics\AnalyticsService;

test('admin point stats include penalty shootout earnings', function () {
    $user = createUser(['total_points' => 0]);

    PointTransaction::query()->create([
        'user_id' => $user->id,
        'season_id' => null,
        'source_type' => PointSourceType::DailyClaim->value,
        'source_id' => 'claim-1',
        'amount' => 25,
        'balance_after' => 25,
        'reason' => 'Daily claim',
        'metadata' => null,
        'idempotency_key' => 'claim-stats-1',
    ]);

    PointTransaction::query()->create([
        'user_id' => $user->id,
        'season_id' => null,
        'source_type' => PointSourceType::PenaltyShootout->value,
        'source_id' => 'shootout-1',
        'amount' => 40,
        'balance_after' => 65,
        'reason' => 'Penalty shootout win',
        'metadata' => ['game' => 'penalty_shootout'],
        'idempotency_key' => 'shootout-stats-1',
    ]);

    $analytics = app(AnalyticsService::class);
    $dashboard = app(AdminDashboardDataService::class)->data();

    expect($analytics->totalPointsDistributed())->toBe(65)
        ->and($analytics->pointsFromSource(PointSourceType::PenaltyShootout))->toBe(40)
        ->and($analytics->pointsAwardedInPeriod(30))->toBe(65)
        ->and($analytics->pointsBySource(30))->toHaveKey(PointSourceType::PenaltyShootout->value)
        ->and($analytics->pointsBySource(30)[PointSourceType::PenaltyShootout->value])->toBe(40)
        ->and($analytics->sourceTypeLabels())->toHaveKey(PointSourceType::PenaltyShootout->value)
        ->and($dashboard['stats']['total_points_distributed'])->toBe(65)
        ->and($dashboard['stats']['shootout_points_distributed'])->toBe(40)
        ->and($dashboard['points_by_source'][PointSourceType::PenaltyShootout->value])->toBe(40)
        ->and(array_sum($dashboard['points_series']['values']))->toBe(65);
});

test('admin dashboard api exposes shootout point totals', function () {
    $admin = createAdminUser();
    $user = createUser();

    PointTransaction::query()->create([
        'user_id' => $user->id,
        'season_id' => null,
        'source_type' => PointSourceType::PenaltyShootout->value,
        'source_id' => 'shootout-api-1',
        'amount' => 12,
        'balance_after' => 12,
        'reason' => 'Penalty shootout win',
        'metadata' => null,
        'idempotency_key' => 'shootout-api-1',
    ]);

    $this->actingAs($admin)
        ->getJson('/app/api/dashboard')
        ->assertSuccessful()
        ->assertJsonPath('stats.total_points_distributed', 12)
        ->assertJsonPath('stats.shootout_points_distributed', 12)
        ->assertJsonPath('points_by_source.penalty_shootout', 12);
});
