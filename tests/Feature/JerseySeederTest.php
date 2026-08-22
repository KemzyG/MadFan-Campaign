<?php

use App\Models\Club;
use App\Models\Jersey;
use App\Models\JerseyVariant;
use Database\Seeders\ClubSeeder;
use Database\Seeders\JerseySeeder;

test('jersey seeder creates at least 100 kits across every club', function () {
    $this->seed(ClubSeeder::class);
    $this->seed(JerseySeeder::class);

    $clubCount = Club::query()->count();
    $jerseyCount = Jersey::query()->count();

    expect($clubCount)->toBeGreaterThanOrEqual(25)
        ->and($jerseyCount)->toBeGreaterThanOrEqual(100)
        ->and($jerseyCount)->toBe($clubCount * 4 + 1);

    Club::query()->each(function (Club $club): void {
        expect(Jersey::query()->where('club_id', $club->id)->count())->toBe(4);
    });

    expect(Jersey::query()->whereNull('club_id')->where('slug', 'mad-fan-terrace-tee')->exists())->toBeTrue();
    expect(JerseyVariant::query()->count())->toBeGreaterThan($jerseyCount);
});

test('jersey seeder is idempotent on repeat runs', function () {
    $this->seed(ClubSeeder::class);
    $this->seed(JerseySeeder::class);

    $jerseyCount = Jersey::query()->count();
    $variantCount = JerseyVariant::query()->count();

    $this->seed(JerseySeeder::class);

    expect(Jersey::query()->count())->toBe($jerseyCount)
        ->and(JerseyVariant::query()->count())->toBe($variantCount);
});

test('shop listing shows seeded kits for onboarded fans', function () {
    $this->seed(ClubSeeder::class);
    $this->seed(JerseySeeder::class);

    $club = Club::query()->orderBy('id')->firstOrFail();
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->get(route('social.shop.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Shop/Index')
            ->has('jerseys')
            ->where('jerseys', fn ($jerseys) => count($jerseys) >= 100)
            ->where('jerseys.0.kit_kind', fn ($kind) => is_string($kind) && $kind !== '')
            ->has('jerseys.0.sizes_available'));
});
