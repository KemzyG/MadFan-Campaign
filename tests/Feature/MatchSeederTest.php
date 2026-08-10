<?php

use App\Enums\MatchStatus;
use App\Models\MatchFixture;
use Database\Seeders\ClubSeeder;
use Database\Seeders\MatchSeeder;
use Database\Seeders\ProductionCoreSeeder;

test('match seeder creates five upcoming purchasable fixtures without factories', function () {
    $this->seed(ClubSeeder::class);
    $this->seed(MatchSeeder::class);

    $fixtures = MatchFixture::query()
        ->upcoming()
        ->with(['homeClub', 'awayClub'])
        ->get();

    expect($fixtures)->toHaveCount(5);

    foreach ($fixtures as $fixture) {
        expect($fixture->status)->toBe(MatchStatus::Upcoming)
            ->and($fixture->isPurchasable())->toBeTrue()
            ->and((float) $fixture->price)->toBeGreaterThan(0)
            ->and($fixture->venue)->not->toBeEmpty()
            ->and($fixture->homeClub)->not->toBeNull()
            ->and($fixture->awayClub)->not->toBeNull()
            ->and($fixture->home_club_id)->not->toBe($fixture->away_club_id);
    }

    $this->seed(MatchSeeder::class);

    expect(MatchFixture::query()->count())->toBe(5)
        ->and(MatchFixture::query()->upcoming()->count())->toBe(5);
});

test('production core seeder wires match catalogue after clubs', function () {
    $this->seed(ProductionCoreSeeder::class);

    expect(MatchFixture::query()->upcoming()->count())->toBe(5);
});
