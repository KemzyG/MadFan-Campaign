<?php

test('site landing page is public at root', function () {
    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Landing')
            ->has('featured'));
});

test('campaign app landing lives at /campaign', function () {
    $this->get('/campaign')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Campaign'));
});

test('fan.home and fan.campaign named routes resolve correctly', function () {
    expect(route('fan.home', absolute: false))->toBe('/')
        ->and(route('fan.campaign', absolute: false))->toBe('/campaign');
});
