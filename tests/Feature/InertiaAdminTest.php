<?php

use App\Models\Setting;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

test('guests are redirected to login from inertia admin', function () {
    $this->get('/ops')->assertRedirect('/ops/login');
});

test('regular users cannot access inertia admin', function () {
    $user = createUser();

    $this->actingAs($user)
        ->get('/ops')
        ->assertForbidden();
});

test('admin users can access inertia dashboard', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/ops')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('stats')
            ->has('stats.daily_active_fans_today')
            ->has('stats.daily_posts_today')
            ->has('stats.daily_engagement_today')
            ->has('stats.daily_active_live_today')
            ->has('stats.daily_events_today')
            ->has('stats.daily_other_activities_today')
            ->has('stats.active_events_now')
            ->has('active_fans_series')
            ->has('live_series')
            ->has('events_series')
            ->has('activities_series')
            ->has('active_events')
            ->has('top_users')
        );
});

test('admin users can access inertia admin pages', function (string $path, string $component) {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get($path)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component($component));
})->with([
    ['/ops/users', 'Admin/Users/Index'],
    ['/ops/staff', 'Admin/Staff/Index'],
    ['/ops/admins', 'Admin/Admins/Index'],
    ['/ops/roles', 'Admin/Roles/Index'],
    ['/ops/tasks', 'Admin/Tasks/Index'],
    ['/ops/seasons', 'Admin/Seasons/Index'],
    ['/ops/loyalty-tiers', 'Admin/LoyaltyTiers/Index'],
    ['/ops/fandoms', 'Admin/Fandoms/Index'],
    ['/ops/leagues', 'Admin/Leagues/Index'],
    ['/ops/clubs', 'Admin/Clubs/Index'],
    ['/ops/posts', 'Admin/Posts/Index'],
    ['/ops/announcements', 'Admin/Announcements/Index'],
    ['/ops/fixtures', 'Admin/Fixtures/Index'],
    ['/ops/reports', 'Admin/Reports/Index'],
    ['/ops/polls', 'Admin/Polls/Index'],
    ['/ops/predictions', 'Admin/Predictions/Index'],
    ['/ops/stages', 'Admin/Stages/Index'],
    ['/ops/channels', 'Admin/Channels/Index'],
    ['/ops/highlights', 'Admin/Highlights/Index'],
    ['/ops/leaderboard', 'Admin/Leaderboard/Index'],
    ['/ops/referrals', 'Admin/Referrals/Index'],
    ['/ops/point-transactions', 'Admin/PointTransactions/Index'],
    ['/ops/activity-logs', 'Admin/ActivityLogs/Index'],
    ['/ops/settings', 'Admin/Settings/Index'],
    ['/ops/system-logs', 'Admin/SystemLogs/Index'],
]);

test('support cannot access admins or roles pages', function () {
    $support = createSupportAdmin();

    $this->actingAs($support)->get('/ops/admins')->assertForbidden();
    $this->actingAs($support)->get('/ops/roles')->assertForbidden();
});

test('social admin pages live on ops not filament or legacy app path', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/ops/posts')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/Posts/Index'));

    $this->actingAs($admin)
        ->get('/admin/posts')
        ->assertNotFound();

    $this->actingAs($admin)
        ->get('/app/posts')
        ->assertRedirect('/ops/posts');
});

test('admin can login via web form and reach dashboard', function () {
    $admin = createAdminUser(['email' => 'inertia-admin@madfan.test']);

    $this->get('/ops/login');

    $this->post('/ops/login', [
        'email' => 'inertia-admin@madfan.test',
        'password' => validTestPassword(),
        '_token' => csrf_token(),
    ])->assertRedirect('/ops');

    $this->assertAuthenticatedAs($admin);
});

test('non-admin cannot login to admin panel', function () {
    createUser(['email' => 'fan@madfan.test']);

    $this->get('/ops/login');

    $this->post('/ops/login', [
        'email' => 'fan@madfan.test',
        'password' => validTestPassword(),
        '_token' => csrf_token(),
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('admin api dashboard returns stats json', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->getJson('/ops/api/dashboard')
        ->assertSuccessful()
        ->assertJsonStructure([
            'stats' => [
                'total_users',
                'new_users_today',
                'total_points_distributed',
                'daily_active_fans_today',
                'daily_posts_today',
                'daily_engagement_today',
                'daily_active_live_today',
                'daily_events_today',
                'daily_other_activities_today',
                'active_events_now',
            ],
            'active_fans_series',
            'live_series',
            'events_series',
            'activities_series',
            'active_events',
            'top_users',
            'recent_activity',
        ]);
});

test('admin leaderboard page returns scoped board data', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/ops/leaderboard?scope=global&limit=25')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Leaderboard/Index')
            ->where('scope', 'global')
            ->has('board.entries')
            ->has('board.total_fans')
            ->has('scope_options')
            ->has('fandoms')
            ->has('clubs')
            ->has('leagues')
        );
});

test('admin can update settings via inertia form', function () {
    $admin = createAdminUser();

    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'registration_enabled' => true,
            'send_registration_welcome_email' => false,
            'registration_welcome_email_subject' => 'Welcome to Mad Fan!',
            'mail_mailer' => 'log',
            'mail_host' => '127.0.0.1',
            'mail_port' => 2525,
            'mail_username' => '',
            'mail_encryption' => 'tls',
            'mail_from_address' => 'hello@madfan.test',
            'mail_from_name' => 'Mad Fan',
            'social_verification_required' => true,
            'task_social_verification_enabled' => true,
            'referral_bonus_points' => 500,
            'daily_claim_base_points' => 25,
            'streak_reset_hours' => 36,
            'discord_invite_url' => 'https://discord.gg/test',
            'telegram_channel_username' => '@test',
            'twitter_target_username' => 'test',
            'system_maintenance' => false,
        ])
        ->assertRedirect(route('admin.settings'))
        ->assertSessionHas('success');

    expect(Setting::query()->where('key', 'daily_claim_base_points')->value('value'))->toBe('25');
});
