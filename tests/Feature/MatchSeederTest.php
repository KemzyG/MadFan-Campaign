<?php

use App\Enums\MatchStatus;
use App\Models\MatchFixture;
use Database\Seeders\ClubSeeder;
use Database\Seeders\MatchSeeder;
use Database\Seeders\ProductionCoreSeeder;

test('match seeder creates a full fixture board without factories', function () {
    $this->seed(ClubSeeder::class);
    $this->seed(MatchSeeder::class);

    $upcoming = MatchFixture::query()->upcoming()->get();

    expect($upcoming->count())->toBeGreaterThanOrEqual(5)
        ->and(MatchFixture::query()->where('status', MatchStatus::Live)->count())->toBe(1)
        ->and(MatchFixture::query()->where('status', MatchStatus::Finished)->count())->toBe(2);

    foreach ($upcoming as $fixture) {
        expect($fixture->status)->toBe(MatchStatus::Upcoming)
            ->and($fixture->isPurchasable())->toBeTrue()
            ->and((float) $fixture->price)->toBeGreaterThan(0)
            ->and($fixture->venue)->not->toBeEmpty()
            ->and($fixture->home_club_id)->not->toBe($fixture->away_club_id);
    }

    $total = MatchFixture::query()->count();

    $this->seed(MatchSeeder::class);

    expect(MatchFixture::query()->count())->toBe($total)
        ->and(MatchFixture::query()->upcoming()->count())->toBe($upcoming->count());
});

test('production core seeder wires match catalogue after clubs', function () {
    $this->seed(ProductionCoreSeeder::class);

    expect(MatchFixture::query()->upcoming()->count())->toBeGreaterThanOrEqual(5)
        ->and(MatchFixture::query()->where('status', MatchStatus::Live)->exists())->toBeTrue()
        ->and(MatchFixture::query()->where('status', MatchStatus::Finished)->exists())->toBeTrue();
});
