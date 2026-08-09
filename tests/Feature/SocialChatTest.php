<?php

use App\Models\Channel;
use App\Models\Club;
use App\Models\ClubServer;
use App\Support\ApplicationSettings;

test('social chat requires authentication', function () {
    $this->get('/social/chat')->assertRedirect(route('login'));
});

test('social chat is blocked when the network setting is disabled', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'false']);

    $user = createUser(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->get('/social/chat')
        ->assertRedirect(route('fan.campaign'));
});

test('onboarded fans can open club chat with default channels', function () {
    $club = Club::factory()->create(['name' => 'Radio FC']);
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->get('/social/chat')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Chat')
            ->where('club.name', 'Radio FC')
            ->where('channel.slug', 'general')
            ->where('realtime.mode', 'poll')
            ->has('channels', 2)
            ->has('messages.items'));

    expect(ClubServer::query()->where('club_id', $club->id)->exists())->toBeTrue();
    expect(Channel::query()->where('slug', 'general')->exists())->toBeTrue();
    expect(Channel::query()->where('slug', 'matchday')->exists())->toBeTrue();
});

test('fans can switch to the matchday channel', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->get('/social/chat?channel=matchday')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Chat')
            ->where('channel.slug', 'matchday'));
});
