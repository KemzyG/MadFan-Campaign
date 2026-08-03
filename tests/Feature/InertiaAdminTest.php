<?php

use App\Models\Setting;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

test('guests are redirected to login from inertia admin', function () {
    $this->get('/app')->assertRedirect('/app/login');
});

test('regular users cannot access inertia admin', function () {
    $user = createUser();

    $this->actingAs($user)
        ->get('/app')
        ->assertForbidden();
});

test('admin users can access inertia dashboard', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/app')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('stats')
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
    ['/app/users', 'Admin/Users/Index'],
    ['/app/staff', 'Admin/Staff/Index'],
    ['/app/tasks', 'Admin/Tasks/Index'],
    ['/app/seasons', 'Admin/Seasons/Index'],
    ['/app/loyalty-tiers', 'Admin/LoyaltyTiers/Index'],
    ['/app/leagues', 'Admin/Leagues/Index'],
    ['/app/clubs', 'Admin/Clubs/Index'],
    ['/app/referrals', 'Admin/Referrals/Index'],
    ['/app/point-transactions', 'Admin/PointTransactions/Index'],
    ['/app/activity-logs', 'Admin/ActivityLogs/Index'],
    ['/app/settings', 'Admin/Settings/Index'],
    ['/app/system-logs', 'Admin/SystemLogs/Index'],
]);

test('admin can login via web form and reach dashboard', function () {
    $admin = createAdminUser(['email' => 'inertia-admin@madfan.test']);

    $this->get('/app/login');

    $this->post('/app/login', [
        'email' => 'inertia-admin@madfan.test',
        'password' => validTestPassword(),
        '_token' => csrf_token(),
    ])->assertRedirect('/app');

    $this->assertAuthenticatedAs($admin);
});

test('non-admin cannot login to admin panel', function () {
    createUser(['email' => 'fan@madfan.test']);

    $this->get('/app/login');

    $this->post('/app/login', [
        'email' => 'fan@madfan.test',
        'password' => validTestPassword(),
        '_token' => csrf_token(),
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('admin api dashboard returns stats json', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->getJson('/app/api/dashboard')
        ->assertSuccessful()
        ->assertJsonStructure([
            'stats' => [
                'total_users',
                'new_users_today',
                'total_points_distributed',
            ],
            'top_users',
            'recent_activity',
        ]);
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
