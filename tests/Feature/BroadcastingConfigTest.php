<?php

test('phpunit forces null broadcast driver by default', function () {
    expect(config('broadcasting.default'))->toBe('null');
});
