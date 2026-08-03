<?php

use App\Models\LoyaltyTier;

test('users table can be migrated before loyalty tiers foreign key exists', function () {
    // RefreshDatabase already ran; assert the FK relationship is present after all migrations.
    expect(Schema::hasTable('users'))->toBeTrue();
    expect(Schema::hasTable('loyalty_tiers'))->toBeTrue();
    expect(Schema::hasColumn('users', 'loyalty_tier_id'))->toBeTrue();

    $user = createUser(['loyalty_tier_id' => null]);

    expect($user->loyalty_tier_id)->toBeNull();
});

test('users loyalty tier foreign key accepts valid tier ids', function () {
    $tier = LoyaltyTier::query()->create([
        'code' => 'TEST_TIER',
        'name' => 'Test Tier',
        'min_points' => 0,
        'max_points' => 100,
        'display_order' => 99,
    ]);

    $user = createUser(['loyalty_tier_id' => $tier->id]);

    expect($user->fresh()->loyalty_tier_id)->toBe($tier->id);
});
