<?php

test('site landing page is public at root', function () {
    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Landing')
            ->has('featured')
            ->has('stats.waitlist_count')
            ->has('story.thesis')
            ->has('story.primitives')
            ->has('story.earn')
            ->has('story.weeks')
            ->has('story.roadmap')
            ->has('story.regions')
            ->has('story.team')
            ->has('story.pages'));
});

test('campaign app landing lives at /campaign', function () {
    $this->get('/campaign')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Campaign'));
});

test('company story pages remain public', function () {
    foreach (['/about', '/roadmap', '/region', '/team'] as $path) {
        $this->get($path)->assertSuccessful();
    }
});

test('company story pages render Fan StaticPage or Team components', function () {
    $this->get('/about')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/StaticPage')
            ->where('slug', 'about')
            ->has('sections')
            ->has('title')
            ->has('eyebrow'));

    $this->get('/roadmap')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/StaticPage')
            ->where('slug', 'roadmap')
            ->has('sections'));

    $this->get('/region')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/StaticPage')
            ->where('slug', 'region')
            ->has('sections'));

    $this->get('/team')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Team')
            ->where('slug', 'team')
            ->has('members')
            ->has('open_roles'));
});

test('fan.home and fan.campaign named routes resolve correctly', function () {
    expect(route('fan.home', absolute: false))->toBe('/')
        ->and(route('fan.campaign', absolute: false))->toBe('/campaign');
});
