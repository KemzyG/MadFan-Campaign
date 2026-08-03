<?php

use App\Services\Analytics\AnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('analytics service builds point series for a date range', function () {
    $service = app(AnalyticsService::class);

    $series = $service->pointsAwardedSeries(7);

    expect($series['labels'])->toHaveCount(7)
        ->and($series['values'])->toHaveCount(7);
});

test('analytics service calculates user growth percent', function () {
    $service = app(AnalyticsService::class);

    expect($service->userGrowthPercent())->toBeFloat();
});
