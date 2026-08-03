<?php

use App\Models\Waitlist;

test('guests can join the waitlist', function () {
    $this->postJson('/api/waitlist', [
        'full_name' => 'Future Fan',
        'email' => 'future@example.com',
        'country' => 'US',
        'club' => 'Arsenal',
    ])->assertCreated();

    expect(Waitlist::where('email', 'future@example.com')->exists())->toBeTrue();
});

test('guests can fetch the waitlist count', function () {
    Waitlist::factory()->count(3)->create();

    $this->getJson('/api/waitlist/count')
        ->assertSuccessful()
        ->assertJsonPath('count', 3);
});

test('waitlist rejoins duplicate emails without enumeration', function () {
    Waitlist::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/waitlist', [
        'full_name' => 'Another Fan',
        'email' => 'taken@example.com',
        'country' => 'US',
        'club' => 'Arsenal',
    ])->assertSuccessful();

    expect(Waitlist::query()->where('email', 'taken@example.com')->count())->toBe(1);
});
