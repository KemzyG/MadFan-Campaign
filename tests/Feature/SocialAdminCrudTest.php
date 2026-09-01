<?php

use App\Enums\EventType;
use App\Enums\MatchStatus;
use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Enums\StageStatus;
use App\Enums\StageType;
use App\Models\Club;
use App\Models\Fandom;
use App\Models\League;
use App\Models\MatchFixture;
use App\Models\Post;
use App\Models\SocialAnnouncement;
use App\Models\Stage;
use App\Models\VideoHighlight;
use Database\Seeders\AdminPermissionsSeeder;

beforeEach(function () {
    $this->seed(AdminPermissionsSeeder::class);
});

test('admin can open all new social admin pages', function () {
    $admin = createAdminUser();

    $pages = [
        '/ops/posts' => 'Admin/Posts/Index',
        '/ops/announcements' => 'Admin/Announcements/Index',
        '/ops/fixtures' => 'Admin/Fixtures/Index',
        '/ops/reports' => 'Admin/Reports/Index',
        '/ops/polls' => 'Admin/Polls/Index',
        '/ops/predictions' => 'Admin/Predictions/Index',
        '/ops/stages' => 'Admin/Stages/Index',
        '/ops/channels' => 'Admin/Channels/Index',
        '/ops/highlights' => 'Admin/Highlights/Index',
        '/ops/fandoms' => 'Admin/Fandoms/Index',
        '/ops/leagues' => 'Admin/Leagues/Index',
        '/ops/clubs' => 'Admin/Clubs/Index',
    ];

    foreach ($pages as $url => $component) {
        $this->actingAs($admin)
            ->get($url)
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page->component($component));
    }
});

test('admin can crud posts fixtures announcements stages and highlights', function () {
    $admin = createAdminUser();
    $fandom = Fandom::factory()->create();
    $league = League::factory()->create(['fandom_id' => $fandom->id]);
    $home = Club::factory()->create(['league_id' => $league->id]);
    $away = Club::factory()->create(['league_id' => $league->id]);

    $post = $this->actingAs($admin)->postJson('/ops/api/posts', [
        'author_id' => $admin->id,
        'club_id' => $home->id,
        'type' => PostType::Status->value,
        'visibility' => PostVisibility::Public->value,
        'body' => 'Hello ops feed',
    ]);
    $post->assertCreated()->assertJsonPath('body', 'Hello ops feed');
    expect(Post::query()->where('body', 'Hello ops feed')->exists())->toBeTrue();

    $announcement = $this->actingAs($admin)->postJson('/ops/api/announcements', [
        'type' => EventType::Concert->value,
        'club_id' => $home->id,
        'headline' => 'Stadium Night',
        'subtitle' => 'Live',
    ]);
    $announcement->assertCreated();
    expect(SocialAnnouncement::query()->where('headline', 'Stadium Night')->exists())->toBeTrue();

    $fixture = $this->actingAs($admin)->postJson('/ops/api/fixtures', [
        'home_club_id' => $home->id,
        'away_club_id' => $away->id,
        'kickoff_at' => now()->addDay()->toISOString(),
        'venue' => 'National Stadium',
        'status' => MatchStatus::Upcoming->value,
        'competition' => 'Friendly',
        'price' => 25,
    ]);
    $fixture->assertCreated();
    $fixtureId = $fixture->json('id');
    expect(MatchFixture::query()->find($fixtureId))->not->toBeNull();

    $stage = $this->actingAs($admin)->postJson('/ops/api/stages', [
        'host_id' => $admin->id,
        'club_id' => $home->id,
        'title' => 'Matchday Room',
        'type' => StageType::Voice->value,
        'status' => StageStatus::Live->value,
    ]);
    $stage->assertCreated();
    expect(Stage::query()->where('title', 'Matchday Room')->exists())->toBeTrue();

    $highlight = $this->actingAs($admin)->postJson('/ops/api/highlights', [
        'author_id' => $admin->id,
        'club_id' => $home->id,
        'title' => 'Goal of the week',
        'video_url' => 'https://cdn.example.com/goal.mp4',
    ]);
    $highlight->assertCreated();
    expect(VideoHighlight::query()->where('title', 'Goal of the week')->exists())->toBeTrue();
});

test('support cannot access leagues but can access posts and reports', function () {
    $support = createSupportAdmin();

    $this->actingAs($support)->get('/ops/leagues')->assertForbidden();
    $this->actingAs($support)->get('/ops/posts')->assertSuccessful();
    $this->actingAs($support)->get('/ops/reports')->assertSuccessful();
});
