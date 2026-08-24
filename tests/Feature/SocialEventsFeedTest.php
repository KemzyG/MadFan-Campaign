<?php

use App\Enums\EventType;
use App\Models\Club;
use App\Models\MatchFixture;
use App\Models\SocialAnnouncement;
use App\Models\SocialEventInterest;

test('events feed requires authentication', function () {
    $this->get('/social')->assertRedirect(route('login'));
});

test('events feed renders live cards above upcoming ones', function () {
    $club = Club::factory()->create(['name' => 'Terrace FC']);
    $user = socialReadyUser($club);
    $away = Club::factory()->create(['name' => 'Away End United']);

    $fixture = MatchFixture::factory()->live()->create([
        'home_club_id' => $club->id,
        'away_club_id' => $away->id,
        'competition' => 'Premier League',
    ]);

    SocialAnnouncement::factory()->concert()->create([
        'headline' => 'Terrace Anthems Live',
    ]);

    $this->actingAs($user)
        ->get('/social')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Events')
            ->where('club.name', 'Terrace FC')
            ->has('events.data', 2)
            ->where('events.data.0.type', EventType::LiveMatch->value)
            ->where('events.data.0.key', 'live_match:'.$fixture->id)
            ->where('events.data.0.phase', 'live')
            ->where('events.data.0.pill', 'LIVE')
            ->where('events.data.0.headline', 'Terrace FC vs Away End United')
            ->where('events.data.0.data.is_live', true)
            ->where('events.data.1.type', EventType::Concert->value)
            ->where('events.data.1.phase', 'upcoming')
            ->where('events.data.1.headline', 'Terrace Anthems Live')
            ->where('events.data.1.cta.label', 'Get tickets')
            ->where('events.meta.total', 2)
            ->where('events.links.next', null));
});

test('the three editorial kinds reach the events feed with their own payloads', function () {
    $user = socialReadyUser();

    SocialAnnouncement::factory()->breakingNews(true)->create([
        'headline' => 'Deadline day scramble',
        'meta' => [
            'source' => 'Mad Fan Newsroom',
            'category' => 'Transfers',
            'is_urgent' => true,
        ],
    ]);

    SocialAnnouncement::factory()->songRelease()->create([
        'headline' => 'Ninety Minutes',
        'meta' => [
            'artist' => 'Mad Fan Collective',
            'track' => 'Ninety Minutes',
            'album' => 'Single',
            'platform' => 'Spotify',
        ],
    ]);

    SocialAnnouncement::factory()->concert()->create([
        'headline' => 'Matchday Eve Session',
        'meta' => [
            'artist' => 'Stretford Sound',
            'venue' => 'Old Trafford Arena',
            'city' => 'Manchester',
            'lineup' => ['Stretford Sound'],
        ],
    ]);

    // Phase drives the order: breaking news reads live, the concert is upcoming,
    // a release that has already dropped is recent.
    $this->actingAs($user)
        ->get('/social')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 3)
            ->where('events.data.0.type', 'breaking_news')
            ->where('events.data.0.phase', 'live')
            ->where('events.data.0.is_pinned', true) // urgent news floats with the pinned rows
            ->where('events.data.0.data.source', 'Mad Fan Newsroom')
            ->where('events.data.0.data.category', 'Transfers')
            ->where('events.data.0.data.is_urgent', true)
            ->where('events.data.1.type', 'concert')
            ->where('events.data.1.phase', 'upcoming')
            ->where('events.data.1.data.venue', 'Old Trafford Arena')
            ->where('events.data.1.data.lineup', ['Stretford Sound'])
            ->where('events.data.2.type', 'song_release')
            ->where('events.data.2.phase', 'recent')
            ->where('events.data.2.pill', 'NEW')
            ->where('events.data.2.data.track', 'Ninety Minutes')
            ->where('events.data.2.data.platform', 'Spotify')
            ->where('events.data.2.cta.label', 'Listen'));
});

test('unpublished and expired announcements stay off the events feed', function () {
    $user = socialReadyUser();

    SocialAnnouncement::factory()->create(['headline' => 'Live and published']);
    SocialAnnouncement::factory()->unpublished()->create(['headline' => 'Still a draft']);
    SocialAnnouncement::factory()->expired()->create(['headline' => 'Yesterday news']);

    $this->actingAs($user)
        ->get('/social')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.headline', 'Live and published'));
});

test('marking interest in an event round-trips and reaches the feed', function () {
    $user = socialReadyUser();
    $announcement = SocialAnnouncement::factory()->create(['headline' => 'Board statement']);
    $key = 'breaking_news:'.$announcement->id;

    $this->actingAs($user)
        ->postJson(route('api.social.events.interest'), [
            'key' => $key,
            'type' => EventType::BreakingNews->value,
        ])
        ->assertSuccessful()
        ->assertJsonPath('interested', true)
        ->assertJsonPath('interest_count', 1);

    expect(SocialEventInterest::query()->where('user_id', $user->id)->where('event_key', $key)->exists())
        ->toBeTrue();

    // A second mark is idempotent rather than a duplicate row.
    $this->actingAs($user)
        ->postJson(route('api.social.events.interest'), [
            'key' => $key,
            'type' => EventType::BreakingNews->value,
        ])
        ->assertJsonPath('interest_count', 1);

    $this->actingAs($user)
        ->get('/social')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('events.data.0.interest.count', 1)
            ->where('events.data.0.interest.active', true));

    $this->actingAs($user)
        ->deleteJson(route('api.social.events.uninterest'), [
            'key' => $key,
            'type' => EventType::BreakingNews->value,
        ])
        ->assertSuccessful()
        ->assertJsonPath('interested', false)
        ->assertJsonPath('interest_count', 0);

    expect(SocialEventInterest::query()->where('event_key', $key)->exists())->toBeFalse();
});

test('interest rejects a key that does not belong to the given type', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->postJson(route('api.social.events.interest'), [
            'key' => 'live_match:12',
            'type' => EventType::Concert->value,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('key');

    expect(SocialEventInterest::query()->count())->toBe(0);
});

test('the type filter narrows the feed while the chips keep unfiltered counts', function () {
    $user = socialReadyUser();

    SocialAnnouncement::factory()->concert()->create(['headline' => 'Terrace Anthems Live']);
    SocialAnnouncement::factory()->create(['headline' => 'Board statement']);

    $this->actingAs($user)
        ->get('/social?type=concert')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('active_filter', 'concert')
            ->has('events.data', 1)
            ->where('events.data.0.headline', 'Terrace Anthems Live')
            ->has('filters', 2)
            ->where('events.empty_message', 'Nothing live under Concert right now.'));
});

test('the events feed reads empty for a fan with nothing happening', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->get('/social')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Events')
            ->has('events.data', 0)
            ->has('filters', 0)
            ->where('active_filter', null)
            ->where('events.empty_message', 'The stadium is quiet. Live matches, drops and Stages land here the moment they start.'));
});
