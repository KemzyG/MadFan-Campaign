<?php

use App\Models\Season;
use App\Support\ApplicationSettings;
use Database\Seeders\LoyaltyTierSeeder;
use Database\Seeders\ReferralMilestoneSeeder;
use Database\Seeders\SeasonSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('users can view and update their passport', function () {
    ensureRegistrationClub('Arsenal');
    $chelsea = ensureRegistrationClub('Chelsea');
    $user = createUser(['name' => 'Fan One', 'club' => 'Arsenal']);
    $this->seed(SeasonSeeder::class);

    $headers = pasetoHeaders($user);

    $this->withHeaders($headers)
        ->getJson('/api/passport')
        ->assertSuccessful()
        ->assertJsonPath('passport.user.name', 'Fan One')
        ->assertJsonPath('passport.user.joined_at', $user->created_at->toIso8601String())
        ->assertJsonPath('passport.user.has_custom_avatar', false)
        ->assertJsonPath('passport.user.avatar_url', '/default-avatar.png');

    $this->actingAs($user)
        ->get('/passport')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Passport')
            ->where('passport.user.joined_at', $user->created_at->toIso8601String())
            ->has('clubs')
            ->where('passport.user.club', 'Arsenal'));

    $chelsea->update(['logo' => 'clubs/chelsea-test.png']);

    $this->actingAs($user)
        ->get('/passport')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Passport')
            ->where('clubs', fn ($clubs) => collect($clubs)->contains(
                fn ($club) => $club['name'] === 'Chelsea'
                    && $club['logo_url'] === $chelsea->fresh()->logo_url
            )));

    $this->withHeaders($headers)
        ->patchJson('/api/passport', [
            'name' => 'Updated Fan',
            'club' => 'Chelsea',
            'avatar_emoji' => '⚽',
        ])
        ->assertSuccessful()
        ->assertJsonPath('passport.user.name', 'Updated Fan')
        ->assertJsonPath('passport.user.club', 'Chelsea');

    expect($user->fresh()->league)->toBe($chelsea->league->name);
});

test('passport bootstraps an active season when none exists', function () {
    $user = connectRequiredSocialAccounts(createUser(['name' => 'Unseeded Fan', 'club' => 'Arsenal FC']));

    expect(Season::query()->where('status', 'active')->exists())->toBeFalse();

    $this->actingAs($user)
        ->get('/passport')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Fan/Passport'));

    expect(Season::query()->where('status', 'active')->exists())->toBeTrue();
});

test('passport share context exposes platform x handle', function () {
    $user = connectRequiredSocialAccounts(createUser(['handle' => '@sharehandle']));

    ApplicationSettings::sync([
        'twitter_target_username' => 'OfficialMadFan',
    ]);

    $this->actingAs($user)
        ->get('/passport')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Passport')
            ->where('platform_x_handle', '@OfficialMadFan'));
});

test('passport page exposes connected accounts section', function () {
    $user = connectRequiredSocialAccounts(createUser(['handle' => '@passportfan']));

    $this->actingAs($user)
        ->get('/passport')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Passport')
            ->has('connected_accounts', 3)
            ->where('required_accounts_complete', true)
            ->has('social_links', 3)
            ->has('referrals.referral_link')
            ->where('referrals.referral_link', fn ($link) => is_string($link) && str_contains($link, $user->fan_id)));
});

test('passport page exposes current season and progress stats', function () {
    $user = connectRequiredSocialAccounts(createUser([
        'handle' => '@seasonfan',
        'total_points' => 100,
        'current_streak_days' => 3,
        'referral_count' => 2,
    ]));
    $this->seed(SeasonSeeder::class);
    $this->seed(LoyaltyTierSeeder::class);
    $this->seed(ReferralMilestoneSeeder::class);

    $season = Season::query()->where('status', 'active')->first();
    // Weighted 1–100%: points 2% (100/5000), streak ~42.86% (3/7), referrals 4% (2/50), tasks 0%
    // 0.5*2 + 0.2*42.857... + 0.15*4 + 0.15*0 ≈ 10
    $expectedLoyaltyScore = 10;

    $this->actingAs($user)
        ->get('/passport')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Passport')
            ->where('passport.season.code', $season->code)
            ->where('passport.season.name', $season->name)
            ->has('passport.stats.tasks_done')
            ->where('passport.stats.loyalty_score', $expectedLoyaltyScore)
            ->where('passport.loyalty_score.total', $expectedLoyaltyScore)
            ->where('passport.loyalty_score.unit', 'percent')
            ->where('passport.loyalty_score.min', 1)
            ->where('passport.loyalty_score.max', 100)
            ->where('passport.loyalty_score.breakdown.points_percent', 2)
            ->where('passport.loyalty_score.breakdown.referral_percent', 4)
            ->where('passport.loyalty_score.breakdown.tasks_percent', 0)
            ->where('passport.user.loyalty_score', $expectedLoyaltyScore)
            ->where('passport.user.loyalty_tier.name', 'CORE FAN')
            ->where('passport.tier_progress.current_tier', 'CORE FAN')
            ->has('passport.tier_progress.progress_percentage')
            ->has('passport.referral_progress.progress_percentage')
            ->has('passport.streak_progress.progress_percentage'));
});

test('passport badge resolves fan tier from points even without loyalty_tier_id', function () {
    $this->seed(LoyaltyTierSeeder::class);
    $this->seed(SeasonSeeder::class);

    $user = connectRequiredSocialAccounts(createUser([
        'handle' => '@ultratier',
        'total_points' => 1500,
        'loyalty_tier_id' => null,
    ]));

    $this->actingAs($user)
        ->get('/passport')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Passport')
            ->where('passport.user.loyalty_tier.name', 'ULTRA FAN')
            ->where('passport.user.loyalty_tier.code', 'ULTRA_FAN')
            ->where('passport.tier_progress.current_tier', 'ULTRA FAN')
            ->where('passport.tier_progress.next_tier', 'LEGEND FAN'));
});

test('users can upload an avatar image on their passport', function () {
    Storage::fake('public');
    ensureRegistrationClub('Arsenal FC');

    $user = createUser(['name' => 'Avatar Fan', 'club' => 'Arsenal FC']);
    $this->seed(SeasonSeeder::class);

    $file = UploadedFile::fake()->createWithContent(
        'fan-avatar.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    // Fan UI posts multipart with _method=PATCH (PHP ignores files on real PATCH).
    $this->actingAs($user)
        ->post('/passport', [
            '_method' => 'PATCH',
            'name' => 'Avatar Fan',
            'handle' => '@avatarfan',
            'club' => 'Arsenal FC',
            'avatar' => $file,
        ])
        ->assertRedirect(route('fan.passport'));

    $user->refresh();

    expect($user->avatar_path)->not->toBeNull()
        ->and($user->avatar_url)->not->toBeNull();

    Storage::disk('public')->assertExists($user->avatar_path);

    $this->actingAs($user)
        ->get('/passport')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Passport')
            ->where('passport.user.avatar_url', $user->avatar_url)
            ->where('passport.user.has_custom_avatar', true));
});

test('users can replace their passport avatar image', function () {
    Storage::fake('public');
    ensureRegistrationClub('Arsenal FC');

    $user = createUser(['name' => 'Replace Avatar Fan', 'club' => 'Arsenal FC']);
    $this->seed(SeasonSeeder::class);

    $first = UploadedFile::fake()->createWithContent(
        'fan-avatar-1.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $this->actingAs($user)
        ->post('/passport', [
            '_method' => 'PATCH',
            'name' => 'Replace Avatar Fan',
            'handle' => '@replaceavatar',
            'club' => 'Arsenal FC',
            'avatar' => $first,
        ])
        ->assertRedirect(route('fan.passport'));

    $user->refresh();
    $firstPath = $user->avatar_path;
    $firstUrl = $user->avatar_url;

    expect($firstPath)->not->toBeNull();
    Storage::disk('public')->assertExists($firstPath);

    $second = UploadedFile::fake()->createWithContent(
        'fan-avatar-2.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $this->actingAs($user)
        ->post('/passport', [
            '_method' => 'PATCH',
            'name' => 'Replace Avatar Fan',
            'handle' => '@replaceavatar',
            'club' => 'Arsenal FC',
            'avatar' => $second,
        ])
        ->assertRedirect(route('fan.passport'));

    $user->refresh();

    expect($user->avatar_path)->not->toBe($firstPath)
        ->and($user->avatar_url)->not->toBe($firstUrl);

    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($user->avatar_path);

    $this->actingAs($user)
        ->get('/passport')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Passport')
            ->where('passport.user.avatar_url', $user->avatar_url));
});

test('passport update ignores empty optional fields', function () {
    Storage::fake('public');
    ensureRegistrationClub('Arsenal FC');

    $user = createUser([
        'name' => 'Partial Fan',
        'handle' => '@keepme',
        'club' => 'Arsenal FC',
    ]);
    $this->seed(SeasonSeeder::class);

    $file = UploadedFile::fake()->createWithContent(
        'fan-avatar.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $this->actingAs($user)
        ->post('/passport', [
            '_method' => 'PATCH',
            'name' => 'Partial Fan',
            'handle' => '',
            'club' => 'Arsenal FC',
            'avatar' => $file,
        ])
        ->assertRedirect(route('fan.passport'))
        ->assertSessionDoesntHaveErrors();

    $user->refresh();

    expect($user->handle)->toBe('@keepme')
        ->and($user->avatar_path)->not->toBeNull();

    Storage::disk('public')->assertExists($user->avatar_path);
});

test('passport avatar can be uploaded without sending handle', function () {
    Storage::fake('public');
    ensureRegistrationClub('Arsenal FC');

    $user = createUser([
        'name' => 'No Handle Fan',
        'handle' => null,
        'club' => 'Arsenal FC',
    ]);
    $this->seed(SeasonSeeder::class);

    $file = UploadedFile::fake()->createWithContent(
        'fan-avatar.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $this->actingAs($user)
        ->post('/passport', [
            '_method' => 'PATCH',
            'name' => 'No Handle Fan',
            'club' => 'Arsenal FC',
            'avatar' => $file,
        ])
        ->assertRedirect(route('fan.passport'))
        ->assertSessionDoesntHaveErrors();

    $user->refresh();

    expect($user->avatar_path)->not->toBeNull();
});

test('passport avatar upload rejects non-image files', function () {
    Storage::fake('public');
    ensureRegistrationClub('Arsenal FC');

    $user = createUser(['club' => 'Arsenal FC']);
    $this->seed(SeasonSeeder::class);

    $this->actingAs($user)
        ->from('/passport')
        ->post('/passport', [
            '_method' => 'PATCH',
            'name' => $user->name,
            'handle' => $user->handle ?? '@fan',
            'club' => 'Arsenal FC',
            'avatar' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
        ])
        ->assertRedirect('/passport')
        ->assertSessionHasErrors('avatar');
});

test('passport and user resources omit internal avatar_path', function () {
    Storage::fake('public');
    ensureRegistrationClub('Arsenal FC');

    $user = createUser(['name' => 'Avatar Path Fan', 'club' => 'Arsenal FC']);
    $this->seed(SeasonSeeder::class);

    $file = UploadedFile::fake()->createWithContent(
        'fan-avatar.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $this->actingAs($user)
        ->post('/passport', [
            '_method' => 'PATCH',
            'name' => 'Avatar Path Fan',
            'handle' => '@avatarpathfan',
            'club' => 'Arsenal FC',
            'avatar' => $file,
        ])
        ->assertRedirect(route('fan.passport'));

    $this->actingAs($user)
        ->get('/passport')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Passport')
            ->missing('passport.user.avatar_path')
            ->has('passport.user.avatar_url'));

    $this->withHeaders(pasetoHeaders($user))
        ->getJson('/api/passport')
        ->assertSuccessful()
        ->assertJsonMissingPath('passport.user.avatar_path')
        ->assertJsonPath('passport.user.has_custom_avatar', true);
});
