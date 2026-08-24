<?php

use App\Models\Club;
use App\Models\ClubMembership;
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

test('verified fans without a club are sent to social onboarding', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'true']);

    $user = createUser();

    $this->actingAs($user)
        ->get('/social')
        ->assertRedirect(route('social.onboarding.club'));
});

test('fans can pick a favourite club and reach social home', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'true']);

    $club = Club::factory()->create(['name' => 'Terrace FC']);
    $user = createUser();

    $this->actingAs($user)
        ->post('/social/onboarding/club', ['club_id' => $club->id])
        ->assertRedirect(route('social.home'));

    $user->refresh();

    expect($user->favourite_club_id)->toBe($club->id)
        ->and($user->social_onboarded_at)->not->toBeNull()
        ->and($user->club)->toBe('Terrace FC');

    expect(ClubMembership::query()->where('user_id', $user->id)->where('club_id', $club->id)->where('is_primary', true)->exists())
        ->toBeTrue();

    $this->actingAs($user)
        ->get('/social')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Events')
            ->where('club.name', 'Terrace FC'));
});
