<?php

use App\Services\Social\LoyaltyScoreService;

beforeEach(function () {
    $this->service = new LoyaltyScoreService;
});

test('user component saturates at full current and best streak', function () {
    expect($this->service->userComponent(30, 90))->toBe(1.0);
});

test('user component is zero with no streak history', function () {
    expect($this->service->userComponent(0, 0))->toBe(0.0);
});

test('user component clamps beyond the streak targets', function () {
    expect($this->service->userComponent(999, 999))->toBe(1.0);
});

test('club component maps first place to one and last toward zero', function () {
    expect($this->service->clubComponentFromPosition(1, 20))->toBe(1.0);
    expect($this->service->clubComponentFromPosition(20, 20))->toBe(0.0);
});

test('club component is null for an unrankable league', function () {
    expect($this->service->clubComponentFromPosition(1, 1))->toBeNull();
    expect($this->service->clubComponentFromPosition(0, 20))->toBeNull();
});

test('global component from rank rewards the top of the board', function () {
    expect($this->service->globalComponentFromRank(1, 100))->toBe(1.0);
    expect($this->service->globalComponentFromRank(100, 100))->toBe(0.0);
});

test('global component from points is a percentile of fans below', function () {
    expect($this->service->globalComponentFromPoints(0, 1))->toBe(1.0); // only fan
    expect($this->service->globalComponentFromPoints(0, 2))->toBe(0.0); // bottom
    expect($this->service->globalComponentFromPoints(1, 2))->toBe(1.0); // top
});

test('composite awards the maximum when every component is full', function () {
    $result = $this->service->composite(1.0, 1.0, 1.0);

    expect($result['score'])->toBe(1000)
        ->and($result['max'])->toBe(1000)
        ->and($result['grade'])->toBe('S')
        ->and($result['components']['club']['available'])->toBeTrue();
});

test('composite renormalises weights when the club component is missing', function () {
    // With club dropped, user+global share the whole scale; both full => max.
    $full = $this->service->composite(1.0, null, 1.0);

    expect($full['score'])->toBe(1000)
        ->and($full['components']['club']['available'])->toBeFalse()
        ->and($full['components']['club']['value'])->toBe(0);

    // Only the user half present (global zero) => 40/75 of the scale.
    $partial = $this->service->composite(1.0, null, 0.0);

    expect($partial['score'])->toBe((int) round(1000 * (0.40 / 0.75)));
});

test('composite reports the lowest grade for a zero score', function () {
    $result = $this->service->composite(0.0, 0.0, 0.0);

    expect($result['score'])->toBe(0)
        ->and($result['grade'])->toBe('E');
});
