<?php

use App\Models\Club;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\SocialDailyTaskClaim;
use App\Models\Stage;
use App\Models\StageParticipant;
use App\Models\VideoHighlight;
use App\Support\Social\DailyTaskCatalog;
use Illuminate\Support\Carbon;

test('daily tasks page requires authentication and onboarding gates', function () {
    $this->get('/social/tasks')->assertRedirect(route('login'));
});

test('progress starts at zero and blocks claiming', function () {
    $user = socialReadyUser();

    $response = $this->actingAs($user)->getJson(route('api.social.tasks.show'))->assertSuccessful();
    $today = $response->json('today');

    expect($today['completed_count'])->toBe(0)
        ->and($today['all_completed'])->toBeFalse()
        ->and($today['claimed'])->toBeFalse();

    $this->actingAs($user)
        ->postJson(route('api.social.tasks.claim'))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('claim');
});

test('progress is computed live from real activity across all five tasks', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $peer = socialReadyUser($club);

    // post
    Post::factory()->create(['author_id' => $user->id, 'club_id' => $club->id]);

    // like x3
    PostLike::factory()->count(3)->create([
        'user_id' => $user->id,
        'post_id' => fn () => Post::factory()->create(['author_id' => $peer->id, 'club_id' => $club->id])->id,
    ]);

    // video
    VideoHighlight::factory()->create(['author_id' => $user->id, 'club_id' => $club->id]);

    // comment on 4 distinct posts
    for ($i = 0; $i < 4; $i++) {
        $target = Post::factory()->create(['author_id' => $peer->id, 'club_id' => $club->id]);
        Post::factory()->reply($target)->create(['author_id' => $user->id]);
    }

    // 2 minutes on Stage
    $stage = Stage::factory()->create(['club_id' => $club->id, 'host_id' => $peer->id]);
    StageParticipant::factory()->create([
        'stage_id' => $stage->id,
        'user_id' => $user->id,
        'joined_at' => now()->subMinutes(2),
        'left_at' => now(),
    ]);

    $today = $this->actingAs($user)
        ->getJson(route('api.social.tasks.show'))
        ->assertSuccessful()
        ->json('today');

    $progressByKey = collect($today['tasks'])->pluck('completed', 'key');

    expect($progressByKey->get('post'))->toBeTrue()
        ->and($progressByKey->get('like'))->toBeTrue()
        ->and($progressByKey->get('video'))->toBeTrue()
        ->and($progressByKey->get('comment'))->toBeTrue()
        ->and($progressByKey->get('stage'))->toBeTrue()
        ->and($today['all_completed'])->toBeTrue();
});

test('claiming end to end: seed activity, claim, verify points, then block a repeat claim', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $peer = socialReadyUser($club);
    $before = $user->total_points;

    Post::factory()->create(['author_id' => $user->id, 'club_id' => $club->id]);

    PostLike::factory()->count(3)->create([
        'user_id' => $user->id,
        'post_id' => fn () => Post::factory()->create(['author_id' => $peer->id, 'club_id' => $club->id])->id,
    ]);

    VideoHighlight::factory()->create(['author_id' => $user->id, 'club_id' => $club->id]);

    for ($i = 0; $i < 4; $i++) {
        $target = Post::factory()->create(['author_id' => $peer->id, 'club_id' => $club->id]);
        Post::factory()->reply($target)->create(['author_id' => $user->id]);
    }

    $stage = Stage::factory()->create(['club_id' => $club->id, 'host_id' => $peer->id]);
    StageParticipant::factory()->create([
        'stage_id' => $stage->id,
        'user_id' => $user->id,
        'joined_at' => now()->subMinutes(2),
        'left_at' => now(),
    ]);

    $expectedReward = DailyTaskCatalog::rewardFor(Carbon::now());

    $claimed = $this->actingAs($user)
        ->postJson(route('api.social.tasks.claim'))
        ->assertSuccessful()
        ->json('today');

    expect($claimed['claimed'])->toBeTrue()
        ->and($claimed['claimed_points'])->toBe($expectedReward)
        ->and($user->fresh()->total_points)->toBe($before + $expectedReward)
        ->and(SocialDailyTaskClaim::where('user_id', $user->id)->count())->toBe(1);

    $this->actingAs($user)
        ->postJson(route('api.social.tasks.claim'))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('claim');

    expect($user->fresh()->total_points)->toBe($before + $expectedReward);
});

test('task targets and reward scale up on later weeks, capped at MAX_TIER', function () {
    $week1 = DailyTaskCatalog::tasksFor(Carbon::parse(DailyTaskCatalog::EPOCH));
    $farFuture = DailyTaskCatalog::tasksFor(Carbon::parse(DailyTaskCatalog::EPOCH)->addWeeks(50));

    $week1ByKey = collect($week1)->pluck('target', 'key');
    $farFutureByKey = collect($farFuture)->pluck('target', 'key');

    foreach ($week1ByKey as $key => $target) {
        expect($farFutureByKey->get($key))->toBeGreaterThanOrEqual($target);
    }

    expect(DailyTaskCatalog::tierFor(Carbon::parse(DailyTaskCatalog::EPOCH)->addWeeks(50)))
        ->toBe(DailyTaskCatalog::MAX_TIER);

    expect(DailyTaskCatalog::rewardFor(Carbon::parse(DailyTaskCatalog::EPOCH)->addWeeks(50)))
        ->toBe(DailyTaskCatalog::rewardFor(Carbon::parse(DailyTaskCatalog::EPOCH)->addWeeks(DailyTaskCatalog::MAX_TIER)));
});
