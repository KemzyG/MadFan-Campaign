<?php

use App\Mail\FanRegistrationWelcomeMail;
use App\Models\Task;
use App\Models\UserTaskProgress;
use App\Support\ApplicationSettings;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaskSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
});

test('admin can update application settings via inertia form', function () {
    $admin = createAdminUser();

    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'registration_enabled' => false,
            'send_registration_welcome_email' => true,
            'registration_welcome_email_subject' => 'You joined Mad Fan!',
            'mail_mailer' => 'smtp',
            'mail_host' => 'smtp.mailtrap.io',
            'mail_port' => 587,
            'mail_username' => 'mailuser',
            'mail_password' => 'secret-pass',
            'mail_encryption' => 'tls',
            'mail_from_address' => 'noreply@madfan.test',
            'mail_from_name' => 'Mad Fan',
            'social_verification_required' => false,
            'task_social_verification_enabled' => false,
            'referral_bonus_points' => 750,
            'daily_claim_base_points' => 25,
            'streak_reset_hours' => 36,
            'discord_invite_url' => 'https://discord.gg/test',
            'telegram_channel_username' => '@test',
            'twitter_target_username' => 'test',
            'system_maintenance' => true,
        ])
        ->assertRedirect(route('admin.settings'))
        ->assertSessionHas('success');

    expect(ApplicationSettings::bool('registration_enabled'))->toBeFalse()
        ->and(ApplicationSettings::bool('send_registration_welcome_email'))->toBeTrue()
        ->and(ApplicationSettings::bool('social_verification_required'))->toBeFalse()
        ->and(ApplicationSettings::referralBonusPoints())->toBe(750)
        ->and(ApplicationSettings::dailyClaimBasePoints())->toBe(25)
        ->and(ApplicationSettings::get('mail_host'))->toBe('smtp.mailtrap.io')
        ->and(ApplicationSettings::mailPassword())->toBe('secret-pass');
});

test('settings page exposes segmented configuration groups', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get(route('admin.settings'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Index')
            ->has('segments', 4)
            ->where('segments.1.key', 'email'));
});

test('empty mail password does not overwrite stored credential', function () {
    ApplicationSettings::sync([
        'mail_password' => 'keep-me',
    ]);

    ApplicationSettings::sync([
        'mail_host' => 'smtp.example.com',
        'mail_password' => '',
    ]);

    expect(ApplicationSettings::mailPassword())->toBe('keep-me');
});

test('registration is blocked when disabled in settings', function () {
    ApplicationSettings::sync(['registration_enabled' => 'false']);

    $this->get('/register')
        ->assertRedirect(route('fan.campaign'))
        ->assertSessionHas('error');
});

test('social verification is disabled by default', function () {
    expect(ApplicationSettings::socialVerificationRequired())->toBeFalse();
});

test('social verification middleware is skipped when disabled in settings', function () {
    // Default is already disabled.
    $user = createUser();

    $this->actingAs($user)
        ->get('/tasks')
        ->assertSuccessful();
});

test('welcome email is sent when registration email setting is enabled', function () {
    Mail::fake();

    ApplicationSettings::sync([
        'send_registration_welcome_email' => 'true',
        'registration_welcome_email_subject' => 'Welcome aboard!',
        'social_verification_required' => 'false',
    ]);

    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->post('/register', fanRegisterPayload([
        'name' => 'Email Fan',
        'email' => 'emailfan@madfan.test',
        'club' => 'Arsenal FC',
    ]))->assertRedirect(route('verification.notice'));

    Mail::assertSent(FanRegistrationWelcomeMail::class, function (FanRegistrationWelcomeMail $mail): bool {
        return $mail->hasTo('emailfan@madfan.test')
            && $mail->emailSubject === 'Welcome aboard!';
    });
});

test('maintenance mode redirects fans but allows admins', function () {
    ApplicationSettings::sync(['system_maintenance' => 'true']);

    $user = connectRequiredSocialAccounts(createUser());

    $this->actingAs($user)
        ->get('/daily-claim')
        ->assertRedirect(route('fan.campaign'))
        ->assertSessionHas('error');

    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/app/settings')
        ->assertSuccessful();

    $this->actingAs($admin)
        ->get('/daily-claim')
        ->assertSuccessful();
});

test('maintenance mode allows filament admin routes', function () {
    ApplicationSettings::sync(['system_maintenance' => 'true']);

    $admin = createSuperAdminUser();
    $this->seed(SettingSeeder::class);

    $this->actingAs($admin)
        ->get('/admin/settings')
        ->assertSuccessful();
});

test('task social verification disabled sends submissions to manual review', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    ApplicationSettings::sync(['task_social_verification_enabled' => 'false']);

    $user = connectRequiredSocialAccounts(createUser(['handle' => '@testfan']));
    $this->seed([
        SeasonSeeder::class,
        TaskSeeder::class,
    ]);

    $task = Task::query()->where('verification_required', true)->first();
    expect($task)->not->toBeNull();

    $this->actingAs($user)
        ->post("/tasks/{$task->id}/confirm", [
            '_token' => csrf_token(),
            'proof_url' => 'https://x.com/testfan',
        ])
        ->assertRedirect(route('fan.tasks'));

    expect(UserTaskProgress::query()
        ->where('user_id', $user->id)
        ->where('task_id', $task->id)
        ->value('verification_status'))->toBe('pending');
});
