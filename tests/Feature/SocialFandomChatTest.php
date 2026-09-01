<?php

use App\Enums\ChannelScope;
use App\Models\Channel;
use App\Models\User;
use App\Support\ApplicationSettings;

/**
 * A user with only a fandom and no club at all — the reality for every fan
 * onboarded after the "Choose your club" step was removed. socialReadyUser()
 * (the shared helper) always attaches a club, so this exercises the actual
 * new-user shape directly rather than through it.
 */
function fandomOnlyUser(): User
{
    ApplicationSettings::sync(['social_network_enabled' => 'true']);
    $fandom = ensureRegistrationFandom();

    return createUser([
        'email_verified_at' => now(),
        'favourite_fandom_id' => $fandom->id,
        'favourite_club_id' => null,
        'social_onboarded_at' => now(),
        'handle' => 'fan'.fake()->unique()->numerify('######'),
    ]);
}

test('a fandom-only fan (no club at all) can open chat without a 403', function () {
    $user = fandomOnlyUser();

    $this->actingAs($user)
        ->get('/social/chat')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Chat/Index')
            ->where('fandom.id', $user->favourite_fandom_id)
            ->where('club', null));
});

test('a fandom-only fan can open and post in their fandom channel', function () {
    $user = fandomOnlyUser();

    $this->actingAs($user)
        ->get('/social/chat?inbox=fandom')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('inbox', 'fandom')
            ->has('channels', 1)
            ->where('channel.scope', 'fandom'));

    $channel = Channel::query()
        ->where('scope', ChannelScope::Fandom)
        ->whereHas('fandomServer', fn ($q) => $q->where('fandom_id', $user->favourite_fandom_id))
        ->firstOrFail();

    $this->actingAs($user)
        ->postJson(route('api.social.chat.messages.store', $channel), ['body' => 'Hello fandom.'])
        ->assertCreated();
});

test('two fans of the same fandom (neither with a club) share a fandom channel and roster', function () {
    $a = fandomOnlyUser();
    $b = fandomOnlyUser();

    $this->actingAs($a)->get('/social/chat?inbox=fandom')->assertSuccessful();
    $channel = Channel::query()->where('scope', ChannelScope::Fandom)->firstOrFail();

    $this->actingAs($a)
        ->postJson(route('api.social.chat.messages.store', $channel), ['body' => 'Anyone else buzzing for this?'])
        ->assertCreated();

    $this->actingAs($b)
        ->getJson(route('api.social.chat.unread-count'))
        ->assertSuccessful()
        ->assertJsonPath('unread_count', 1);

    $this->actingAs($b)
        ->getJson('/api/social/chat/channels/'.$channel->id.'/members')
        ->assertSuccessful()
        ->assertJsonPath('data.scope', 'fandom')
        ->assertJsonCount(2, 'data.members');
});

test('a fan of a different fandom cannot read or post in someone else\'s fandom channel', function () {
    $member = fandomOnlyUser();

    $this->actingAs($member)->get('/social/chat?inbox=fandom')->assertSuccessful();
    $channel = Channel::query()->where('scope', ChannelScope::Fandom)->firstOrFail();

    $otherFandom = App\Models\Fandom::query()->create(['name' => 'Esports', 'slug' => 'esports-'.fake()->unique()->numerify('####'), 'is_active' => true]);
    $outsider = createUser([
        'email_verified_at' => now(),
        'favourite_fandom_id' => $otherFandom->id,
        'social_onboarded_at' => now(),
        'handle' => 'fan'.fake()->unique()->numerify('######'),
    ]);

    $this->actingAs($outsider)
        ->getJson('/api/social/chat/channels/'.$channel->id.'/members')
        ->assertForbidden();

    $this->actingAs($outsider)
        ->postJson(route('api.social.chat.messages.store', $channel), ['body' => 'Sneaking in.'])
        ->assertForbidden();
});
