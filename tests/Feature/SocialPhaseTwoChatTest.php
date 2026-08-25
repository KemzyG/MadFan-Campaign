<?php

use App\Actions\Social\AwardSocialPoints;
use App\Models\Channel;
use App\Models\Club;
use App\Models\ClubMembership;
use App\Models\Message;
use App\Models\PointTransaction;
use App\Support\ApplicationSettings;

test('onboarded members can send a chat message to their club channel', function () {
    $club = Club::factory()->create(['name' => 'Send United']);
    $user = socialReadyUser($club);

    $this->actingAs($user)->get('/social/chat')->assertSuccessful();

    $channel = Channel::query()->where('slug', 'general')->first();

    expect($channel)->not->toBeNull();

    $this->actingAs($user)
        ->post(route('social.chat.messages.store', $channel), [
            'body' => 'Floodlights look good tonight.',
        ])
        ->assertRedirect(route('social.chat', ['inbox' => 'club', 'channel' => 'general']));

    $message = Message::query()->first();

    expect($message)->not->toBeNull()
        ->and($message->body)->toBe('Floodlights look good tonight.')
        ->and($message->author_id)->toBe($user->id)
        ->and($message->channel_id)->toBe($channel->id);

    $this->actingAs($user)
        ->get('/social/chat')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Chat/Index')
            ->has('messages.items', 1)
            ->where('messages.items.0.body', 'Floodlights look good tonight.'));
});

test('chat message awards social_chat points with min length', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)->get('/social/chat')->assertSuccessful();
    $channel = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($user)
        ->post(route('social.chat.messages.store', $channel), [
            'body' => 'Hello',
        ])
        ->assertRedirect();

    expect(PointTransaction::query()
        ->where('user_id', $user->id)
        ->where('source_type', AwardSocialPoints::SOURCE_CHAT)
        ->exists())->toBeTrue();

    expect((int) $user->fresh()->total_points)->toBe(AwardSocialPoints::RULES[AwardSocialPoints::SOURCE_CHAT]['points']);
});

test('empty chat body is rejected', function () {
    $user = socialReadyUser();
    $this->actingAs($user)->get('/social/chat')->assertSuccessful();
    $channel = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($user)
        ->post(route('social.chat.messages.store', $channel), ['body' => '   '])
        ->assertSessionHasErrors('body');
});

test('chat body longer than 500 characters is rejected', function () {
    $user = socialReadyUser();
    $this->actingAs($user)->get('/social/chat')->assertSuccessful();
    $channel = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($user)
        ->post(route('social.chat.messages.store', $channel), [
            'body' => str_repeat('a', 501),
        ])
        ->assertSessionHasErrors('body');
});

test('fans cannot send messages to another clubs channel', function () {
    $home = Club::factory()->create();
    $away = Club::factory()->create();
    $member = socialReadyUser($home);
    $rival = socialReadyUser($away);

    $this->actingAs($rival)->get('/social/chat')->assertSuccessful();
    $awayChannel = Channel::query()
        ->where('slug', 'general')
        ->whereHas('clubServer', fn ($q) => $q->where('club_id', $away->id))
        ->firstOrFail();

    $this->actingAs($member)
        ->post(route('social.chat.messages.store', $awayChannel), [
            'body' => 'Wrong terrace.',
        ])
        ->assertForbidden();

    expect(Message::query()->count())->toBe(0);
});

test('read-only channel rejects messages', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)->get('/social/chat')->assertSuccessful();

    $channel = Channel::query()
        ->where('slug', 'general')
        ->whereHas('clubServer', fn ($q) => $q->where('club_id', $club->id))
        ->firstOrFail();

    $channel->forceFill(['is_read_only' => true])->save();

    $this->actingAs($user)
        ->post(route('social.chat.messages.store', $channel), [
            'body' => 'Should not land.',
        ])
        ->assertForbidden();
});

test('club membership without favourite still authorizes channel view when member', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'true']);

    $club = Club::factory()->create();
    $other = Club::factory()->create();
    $user = createUser([
        'email_verified_at' => now(),
        'favourite_sport_id' => ensureRegistrationSport()->id,
        'favourite_club_id' => $other->id,
        'social_onboarded_at' => now(),
        'handle' => 'fan'.fake()->unique()->numerify('######'),
    ]);

    ClubMembership::factory()->primary()->create([
        'user_id' => $user->id,
        'club_id' => $other->id,
    ]);
    ClubMembership::factory()->create([
        'user_id' => $user->id,
        'club_id' => $club->id,
        'is_primary' => false,
    ]);

    $this->actingAs($user)->get('/social/chat')->assertSuccessful();

    // Provision rival club server via Ensure when a favourite fan opens it:
    $owner = socialReadyUser($club);
    $this->actingAs($owner)->get('/social/chat')->assertSuccessful();

    $channel = Channel::query()
        ->where('slug', 'general')
        ->whereHas('clubServer', fn ($q) => $q->where('club_id', $club->id))
        ->firstOrFail();

    expect($user->can('view', $channel))->toBeTrue();
    expect($user->can('sendMessage', $channel))->toBeTrue();
});
