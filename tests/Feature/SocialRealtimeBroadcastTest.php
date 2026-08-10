<?php

use App\Events\Social\ClubChatMessageCreated;
use App\Events\Social\StageMessageCreated;
use App\Events\Social\StageRoomUpdated;
use App\Models\Channel;
use App\Models\Club;
use App\Models\Stage;
use App\Support\SocialRealtime;
use Illuminate\Support\Facades\Event;

test('club chat message dispatch broadcasts ClubChatMessageCreated', function () {
    Event::fake([ClubChatMessageCreated::class]);

    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)->get('/social/chat')->assertSuccessful();

    $channel = Channel::query()->where('slug', 'general')->firstOrFail();

    $this->actingAs($user)
        ->post(route('social.chat.messages.store', $channel), [
            'body' => 'Reverb terrace ping',
        ])
        ->assertRedirect();

    Event::assertDispatched(ClubChatMessageCreated::class, function (ClubChatMessageCreated $event) use ($channel): bool {
        return (int) $event->message->channel_id === (int) $channel->id
            && $event->message->body === 'Reverb terrace ping';
    });
});

test('stage message and room updates dispatch broadcast events', function () {
    Event::fake([
        StageMessageCreated::class,
        StageRoomUpdated::class,
    ]);

    $club = Club::factory()->create();
    $host = socialReadyUser($club);

    $this->actingAs($host)
        ->post('/social/stage', ['title' => 'Reverb stage'])
        ->assertRedirect();

    $stage = Stage::query()->latest('id')->firstOrFail();

    Event::assertDispatched(StageRoomUpdated::class);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/messages", ['body' => 'Stage shout'])
        ->assertRedirect();

    Event::assertDispatched(StageMessageCreated::class, function (StageMessageCreated $event) use ($stage): bool {
        return (int) $event->message->stage_id === (int) $stage->id
            && $event->message->body === 'Stage shout';
    });
});

test('social realtime meta reports poll when broadcast driver is null', function () {
    config(['broadcasting.default' => 'null']);

    expect(SocialRealtime::enabled())->toBeFalse()
        ->and(SocialRealtime::chatMeta()['mode'])->toBe('poll')
        ->and(SocialRealtime::stageMeta()['mode'])->toBe('poll');
});

test('social realtime meta reports reverb when configured', function () {
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
    ]);

    expect(SocialRealtime::enabled())->toBeTrue()
        ->and(SocialRealtime::chatMeta()['mode'])->toBe('reverb')
        ->and(SocialRealtime::stageMeta()['signal_mode'])->toBe('reverb_with_poll_fallback');
});

test('social chat inertia reports reverb mode when broadcasting is configured', function () {
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
    ]);

    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $this->actingAs($user)
        ->get('/social/chat')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Chat')
            ->where('realtime.mode', 'reverb')
            ->has('realtime.note'));
});
