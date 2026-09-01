<?php

use App\Support\ApplicationSettings;

test('social home requires authentication', function () {
    $this->get('/social')->assertRedirect(route('login'));
});

test('social is blocked when the network setting is disabled', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'false']);

    $user = createUser();

    $this->actingAs($user)
        ->get('/social')
        ->assertRedirect(route('fan.campaign'));
});

test('verified fans without a fandom are sent to social onboarding', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'true']);

    $user = createUser();

    $this->actingAs($user)
        ->get('/social')
        ->assertRedirect(route('social.onboarding.fandom'));
});

test('fans can pick a fandom and reach social home — no club step anymore', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'true']);

    $fandom = ensureRegistrationFandom();
    $user = createUser();

    $this->actingAs($user)
        ->post('/social/onboarding/fandom', ['fandom_id' => $fandom->id])
        ->assertRedirect(route('social.home'));

    $user->refresh();

    expect($user->favourite_fandom_id)->toBe($fandom->id)
        ->and($user->social_onboarded_at)->not->toBeNull()
        ->and($user->favourite_club_id)->toBeNull();

    $this->actingAs($user)
        ->get('/social')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Events')
            ->where('club', null));
});

test('the club onboarding step no longer exists', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'true']);

    $user = createUser(['favourite_fandom_id' => ensureRegistrationFandom()->id]);

    $this->actingAs($user)
        ->get('/social/onboarding/club')
        ->assertNotFound();
});
