<?php

use App\Enums\StageStatus;
use App\Models\Stage;
use App\Services\Admin\AdminDashboardDataService;
use App\Services\Analytics\AnalyticsService;

test('admin dashboard exposes social activity stats instead of task and claim counters', function () {
    $dashboard = app(AdminDashboardDataService::class)->data();
    $stats = $dashboard['stats'];

    expect($stats)->toHaveKeys([
        'daily_active_fans_today',
        'daily_posts_today',
        'daily_engagement_today',
        'daily_active_live_today',
        'daily_events_today',
        'daily_other_activities_today',
        'active_events_now',
    ])->not->toHaveKeys(['daily_claims_today', 'active_tasks']);
});

test('analytics counts live stages started today', function () {
    Stage::factory()->create([
        'status' => StageStatus::Live,
        'started_at' => now(),
    ]);

    expect(app(AnalyticsService::class)->dailyActiveLiveToday())->toBe(1);
});
