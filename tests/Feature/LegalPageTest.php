<?php

use App\Http\Controllers\Inertia\Fan\LegalPageController;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

test('privacy, terms, and guidelines pages are public', function () {
    foreach (['/privacy', '/terms', '/guidelines'] as $path) {
        $this->get($path)->assertSuccessful();
    }
});

test('privacy policy renders Fan Legal with full section content', function () {
    $this->get('/privacy')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Legal')
            ->where('slug', 'privacy')
            ->where('title', 'Privacy Policy')
            ->has('effective_date')
            ->has('intro')
            ->has('sections', 14)
            ->where('sections.0.heading', 'Information We Collect')
            ->has('sections.0.bullets'));
});

test('terms and conditions renders Fan Legal with full section content', function () {
    $this->get('/terms')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Legal')
            ->where('slug', 'terms')
            ->where('title', 'Terms & Conditions')
            ->has('effective_date')
            ->has('intro')
            ->has('sections', 18)
            ->where('sections.0.heading', 'Eligibility')
            ->where('sections.3.heading', 'Loyalty Points, Passport & Rewards'));
});

test('community guidelines renders Fan Legal with full section content', function () {
    $this->get('/guidelines')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Legal')
            ->where('slug', 'guidelines')
            ->where('title', 'Community Guidelines')
            ->has('effective_date')
            ->has('intro')
            ->has('sections', 9)
            ->where('sections.0.heading', 'Nudity and Pornography')
            ->has('sections.0.bullets'));
});

test('an unknown legal doc slug 404s', function () {
    expect(fn () => app(LegalPageController::class)->show('bogus'))
        ->toThrow(NotFoundHttpException::class);
});
