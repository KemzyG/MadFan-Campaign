<?php

use App\Enums\MatchStatus;
use App\Enums\MatchTicketStatus;
use App\Models\Club;
use App\Models\MatchFixture;
use App\Models\MatchTicket;
use App\Support\ApplicationSettings;

test('social tickets require authentication', function () {
    $this->get('/social/tickets')->assertRedirect(route('login'));
});

test('social tickets are blocked when the network setting is disabled', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'false']);

    $user = createUser(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->get('/social/tickets')
        ->assertRedirect(route('fan.campaign'));
});

test('onboarded fans can browse upcoming match tickets', function () {
    $club = Club::factory()->create(['name' => 'Terrace United']);
    $user = socialReadyUser($club);
    $away = Club::factory()->create(['name' => 'Away FC']);

    MatchFixture::factory()->upcoming()->create([
        'home_club_id' => $club->id,
        'away_club_id' => $away->id,
        'venue' => 'Floodlit Park',
        'price' => '32.00',
        'competition' => 'Premier League',
    ]);

    MatchFixture::factory()->finished()->create([
        'home_club_id' => $club->id,
        'away_club_id' => $away->id,
    ]);

    $this->actingAs($user)
        ->get(route('social.tickets.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Tickets/Index')
            ->has('matches', 1)
            ->where('matches.0.venue', 'Floodlit Park')
            ->where('matches.0.price', '32.00')
            ->where('matches.0.purchasable', true)
            ->where('ticket_count', 0));
});

test('fans can confirm purchase and receive a stadium ticket with qr code', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $away = Club::factory()->create();

    $match = MatchFixture::factory()->upcoming()->create([
        'home_club_id' => $club->id,
        'away_club_id' => $away->id,
        'price' => '40.00',
        'venue' => 'North Bank',
    ]);

    $this->actingAs($user)
        ->post(route('social.tickets.purchase', $match))
        ->assertRedirect();

    $ticket = MatchTicket::query()->where('user_id', $user->id)->first();

    expect($ticket)->not->toBeNull()
        ->and($ticket->status)->toBe(MatchTicketStatus::Paid)
        ->and((string) $ticket->price)->toBe('40.00')
        ->and($ticket->section)->toBe('General Admission')
        ->and($ticket->code)->toStartWith('MF')
        ->and($ticket->qrPayload())->toBe('madfan:ticket:'.$ticket->code);

    $this->actingAs($user)
        ->get(route('social.tickets.show', $ticket))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Tickets/Show')
            ->where('ticket.id', $ticket->id)
            ->where('ticket.code', $ticket->code)
            ->where('ticket.qr_payload', $ticket->qrPayload())
            ->where('ticket.match.venue', 'North Bank'));
});

test('fans cannot buy a second ticket for the same match', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $away = Club::factory()->create();

    $match = MatchFixture::factory()->upcoming()->create([
        'home_club_id' => $club->id,
        'away_club_id' => $away->id,
    ]);

    $this->actingAs($user)
        ->post(route('social.tickets.purchase', $match))
        ->assertRedirect(route('social.tickets.show', MatchTicket::query()->first()));

    $this->actingAs($user)
        ->from(route('social.tickets.index'))
        ->post(route('social.tickets.purchase', $match))
        ->assertRedirect(route('social.tickets.index'))
        ->assertSessionHasErrors('match');

    expect(MatchTicket::query()->where('user_id', $user->id)->count())->toBe(1);
});

test('fans can only view their own tickets', function () {
    $ownerClub = Club::factory()->create();
    $owner = socialReadyUser($ownerClub);
    $stranger = socialReadyUser(Club::factory()->create());
    $away = Club::factory()->create();

    $match = MatchFixture::factory()->upcoming()->create([
        'home_club_id' => $ownerClub->id,
        'away_club_id' => $away->id,
    ]);

    $ticket = MatchTicket::factory()->paid()->create([
        'user_id' => $owner->id,
        'match_fixture_id' => $match->id,
        'price' => $match->price,
    ]);

    $this->actingAs($stranger)
        ->get(route('social.tickets.show', $ticket))
        ->assertForbidden();

    $this->actingAs($owner)
        ->get(route('social.tickets.mine'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Tickets/Mine')
            ->has('tickets', 1)
            ->where('tickets.0.id', $ticket->id));
});

test('finished matches cannot be purchased', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $away = Club::factory()->create();

    $match = MatchFixture::factory()->create([
        'home_club_id' => $club->id,
        'away_club_id' => $away->id,
        'status' => MatchStatus::Finished,
        'kickoff_at' => now()->subDay(),
    ]);

    $this->actingAs($user)
        ->from(route('social.tickets.index'))
        ->post(route('social.tickets.purchase', $match))
        ->assertRedirect(route('social.tickets.index'))
        ->assertSessionHasErrors('match');

    expect(MatchTicket::query()->count())->toBe(0);
});
