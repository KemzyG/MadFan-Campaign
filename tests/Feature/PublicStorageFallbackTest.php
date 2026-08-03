<?php

use Illuminate\Support\Facades\Storage;

test('public disk serve delivers club logos at /storage without a symlink', function () {
    Storage::fake('public');

    $path = 'clubs/test-logo.png';
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
    Storage::disk('public')->put($path, $png);

    $this->get('/storage/'.$path)
        ->assertSuccessful()
        ->assertHeader('content-type', 'image/png');
});

test('public disk serve rejects path traversal', function () {
    Storage::fake('public');

    $this->get('/storage/../.env')->assertNotFound();
});

test('public disk serve returns 404 for missing files', function () {
    Storage::fake('public');

    $this->get('/storage/clubs/missing.png')->assertNotFound();
});

test('public disk is configured to serve files for shared hosting', function () {
    expect(config('filesystems.disks.public.serve'))->toBeTrue();
    expect(config('filesystems.disks.local.serve'))->toBeFalse();
});
