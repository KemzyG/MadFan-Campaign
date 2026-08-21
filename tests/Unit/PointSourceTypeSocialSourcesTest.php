<?php

use App\Actions\Social\AwardSocialPoints;
use App\Enums\PointSourceType;

test('PointSourceType includes every AwardSocialPoints source type', function () {
    $enumValues = PointSourceType::values();

    foreach (array_keys(AwardSocialPoints::RULES) as $sourceType) {
        expect($enumValues)->toContain($sourceType);
    }
});

test('PointSourceType includes social_matchday_bonus used by passport', function () {
    expect(PointSourceType::values())->toContain('social_matchday_bonus')
        ->and(PointSourceType::SocialMatchdayBonus->label())->toBe('Social Matchday Bonus');
});

test('pgsql source_type migration lists every social award source', function () {
    $migration = file_get_contents(database_path('migrations/2026_08_21_171332_expand_point_transactions_source_type_for_pgsql.php'));

    expect($migration)->not->toBeFalse();

    foreach ([
        ...array_keys(AwardSocialPoints::RULES),
        'social_matchday_bonus',
    ] as $sourceType) {
        expect($migration)->toContain("'{$sourceType}'");
    }
});
