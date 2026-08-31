<?php

use App\Enums\StageStatus;
use App\Models\Club;
use App\Models\Stage;
use App\Models\StageMessage;
use App\Models\StageParticipant;
use App\Models\StageReaction;
use App\Services\Social\StageService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Live host options added in the Stage redesign: PATCH settings, pin/unpin,
 * dismiss-hand, and deck reactions. The room lifecycle itself is covered by
 * SocialStageTest; this file only exercises the new surfaces.
 */
function stageWithHost(Club $club, App\Models\User $host, array $overrides = []): Stage
{
    $stage = Stage::factory()->live()->create(array_merge([
        'host_id' => $host->id,
        'club_id' => $club->id,
        'title' => 'Options terrace',
    ], $overrides));

    StageParticipant::factory()->host()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
    ]);

    return $stage;
}

test('host can patch stage title description toggles and backdrop', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $stage = stageWithHost($club, $host);

    $this->actingAs($host)
        ->patch("/social/stage/{$stage->id}", [
            'title' => 'Renamed terrace',
            'description' => 'Second-half reactions',
            'is_public' => false,
            'allow_chat' => false,
            'background_key' => 2,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $fresh = $stage->fresh();

    expect($fresh->title)->toBe('Renamed terrace')
        ->and($fresh->description)->toBe('Second-half reactions')
        ->and($fresh->is_public)->toBeFalse()
        ->and($fresh->allow_chat)->toBeFalse()
        ->and($fresh->background_key)->toBe(2);
});

test('a stage title under three characters fails validation', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $stage = stageWithHost($club, $host);

    $this->actingAs($host)
        ->patch("/social/stage/{$stage->id}", ['title' => 'ab'])
        ->assertSessionHasErrors('title');

    expect($stage->fresh()->title)->toBe('Options terrace');
});

test('non-host cannot patch stage settings', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $guest = socialReadyUser($club);
    $stage = stageWithHost($club, $host);

    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $guest->id,
    ]);

    $this->actingAs($guest)
        ->patch("/social/stage/{$stage->id}", ['title' => 'Hijacked room'])
        ->assertForbidden();

    expect($stage->fresh()->title)->toBe('Options terrace');
});

test('an ended stage cannot be patched', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $stage = stageWithHost($club, $host, [
        'status' => StageStatus::Ended,
        'ended_at' => now(),
    ]);

    $this->actingAs($host)
        ->patch("/social/stage/{$stage->id}", ['title' => 'Too late'])
        ->assertForbidden();
});

test('host can pin then unpin a stage message and the room payload exposes it', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $stage = stageWithHost($club, $host);

    $message = StageMessage::query()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
        'body' => 'Pin this call to arms',
    ]);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/pin", ['message_id' => $message->id])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($stage->fresh()->pinned_message_id)->toBe($message->id);

    $this->actingAs($host)
        ->getJson("/social/stage/{$stage->id}/room")
        ->assertSuccessful()
        ->assertJsonPath('pinned_message.id', $message->id)
        ->assertJsonPath('pinned_message.body', 'Pin this call to arms')
        ->assertJsonPath('stage.pinned_message_id', $message->id);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/pin", ['message_id' => null])
        ->assertRedirect();

    expect($stage->fresh()->pinned_message_id)->toBeNull();

    $this->actingAs($host)
        ->getJson("/social/stage/{$stage->id}/room")
        ->assertSuccessful()
        ->assertJsonPath('pinned_message', null);
});

test('a message from another stage cannot be pinned', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $stage = stageWithHost($club, $host);
    $other = stageWithHost($club, $host, ['title' => 'Other room']);

    $foreign = StageMessage::query()->create([
        'stage_id' => $other->id,
        'user_id' => $host->id,
        'body' => 'Belongs elsewhere',
    ]);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/pin", ['message_id' => $foreign->id])
        ->assertSessionHasErrors('message_id');

    expect($stage->fresh()->pinned_message_id)->toBeNull();
});

test('host can dismiss a raised hand but a listener cannot', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $raiser = socialReadyUser($club);
    $bystander = socialReadyUser($club);
    $stage = stageWithHost($club, $host);

    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $raiser->id,
        'speak_requested_at' => now(),
    ]);

    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $bystander->id,
    ]);

    // A listener has no moderation power.
    $this->actingAs($bystander)
        ->post("/social/stage/{$stage->id}/participants/{$raiser->id}/dismiss-hand")
        ->assertForbidden();

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $raiser->id)
        ->whereNotNull('speak_requested_at')
        ->exists())->toBeTrue();

    // The host clears it.
    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/participants/{$raiser->id}/dismiss-hand")
        ->assertRedirect();

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $raiser->id)
        ->value('speak_requested_at'))->toBeNull();
});

test('a listener can claim an open seat outright, no host approval needed', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $listener = socialReadyUser($club);
    $stage = stageWithHost($club, $host, ['max_speakers' => 4]);

    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $listener->id,
    ]);

    $this->actingAs($listener)
        ->post("/social/stage/{$stage->id}/take-seat")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $listener->id)
        ->value('role'))->toBe(App\Enums\StageParticipantRole::Speaker);
});

test('taking a seat fails once the deck is full', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $listener = socialReadyUser($club);
    $stage = stageWithHost($club, $host, ['max_speakers' => 4]);

    // Fill every remaining seat (host already holds one of the 4).
    for ($i = 0; $i < 3; $i++) {
        StageParticipant::factory()->speaker()->create([
            'stage_id' => $stage->id,
            'user_id' => socialReadyUser($club)->id,
        ]);
    }

    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $listener->id,
    ]);

    $this->actingAs($listener)
        ->post("/social/stage/{$stage->id}/take-seat")
        ->assertSessionHasErrors('seat');

    expect(StageParticipant::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $listener->id)
        ->value('role'))->toBe(App\Enums\StageParticipantRole::Listener);
});

test('any active participant can react and the reaction lands in the room payload', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $listener = socialReadyUser($club);
    $stage = stageWithHost($club, $host);

    StageParticipant::factory()->listener()->create([
        'stage_id' => $stage->id,
        'user_id' => $listener->id,
    ]);

    $this->actingAs($listener)
        ->post("/social/stage/{$stage->id}/reactions", ['emoji' => '🔥'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(StageReaction::query()
        ->where('stage_id', $stage->id)
        ->where('user_id', $listener->id)
        ->value('emoji'))->toBe('🔥');

    $this->actingAs($host)
        ->getJson("/social/stage/{$stage->id}/room")
        ->assertSuccessful()
        ->assertJsonPath('reactions.0.emoji', '🔥')
        ->assertJsonPath('reaction_options', StageService::REACTIONS);
});

test('a reaction outside the whitelist is rejected', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $stage = stageWithHost($club, $host);

    $this->actingAs($host)
        ->post("/social/stage/{$stage->id}/reactions", ['emoji' => '🎉'])
        ->assertSessionHasErrors('emoji');

    expect(StageReaction::query()->where('stage_id', $stage->id)->exists())->toBeFalse();
});

test('reactions older than the replay window are excluded from the room payload', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $stage = stageWithHost($club, $host);

    $stale = StageReaction::query()->create([
        'stage_id' => $stage->id,
        'user_id' => $host->id,
        'emoji' => '👏',
    ]);

    // Backdate past the REACTION_WINDOW_SECONDS horizon, bypassing model timestamps.
    StageReaction::query()
        ->where('id', $stale->id)
        ->update(['created_at' => now()->subSeconds(StageService::REACTION_WINDOW_SECONDS + 10)]);

    $this->actingAs($host)
        ->getJson("/social/stage/{$stage->id}/room")
        ->assertSuccessful()
        ->assertJsonPath('reactions', []);
});

test('a listener cannot react after being removed from the stage', function () {
    $club = Club::factory()->create();
    $host = socialReadyUser($club);
    $outsider = socialReadyUser($club);
    $stage = stageWithHost($club, $host);

    // Never joined — no active participant row.
    $this->actingAs($outsider)
        ->post("/social/stage/{$stage->id}/reactions", ['emoji' => '🔥'])
        ->assertForbidden();
});

test('stage reactions use a separate rate limit bucket from the room poll', function () {
    RateLimiter::for('stage-reaction', fn ($request) => Limit::perMinute(3)->by(
        'stage-reaction-test|'.($request->user()?->id ?: $request->ip()),
    ));
    RateLimiter::for('stage-room', fn ($request) => Limit::perMinute(3)->by(
        'stage-room-test|'.($request->user()?->id ?: $request->ip()),
    ));

    try {
        $club = Club::factory()->create();
        $host = socialReadyUser($club);
        $stage = stageWithHost($club, $host);

        foreach (range(1, 3) as $_) {
            $this->actingAs($host)
                ->post("/social/stage/{$stage->id}/reactions", ['emoji' => '🔥'])
                ->assertRedirect();
        }

        $this->actingAs($host)
            ->post("/social/stage/{$stage->id}/reactions", ['emoji' => '🔥'])
            ->assertStatus(429);

        // The dedicated room-poll bucket must stay available after reactions are exhausted.
        $this->actingAs($host)
            ->getJson("/social/stage/{$stage->id}/room")
            ->assertSuccessful();
    } finally {
        RateLimiter::for('stage-reaction', fn ($request) => Limit::perMinute(120)->by(
            'stage-reaction|'.($request->user()?->id ?: $request->ip()),
        ));
        RateLimiter::for('stage-room', fn ($request) => Limit::perMinute(240)->by(
            'stage-room|'.($request->user()?->id ?: $request->ip()),
        ));
    }
});
