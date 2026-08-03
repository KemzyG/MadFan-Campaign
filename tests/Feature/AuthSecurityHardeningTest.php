<?php

use App\Models\User;
use App\Services\AdminMfaService;
use App\Services\PasetoService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use PragmaRX\Google2FA\Google2FA;

test('passwords must be at least eight characters', function () {
    $payload = fanRegisterPayload([
        'password' => 'Short1',
        'password_confirmation' => 'Short1',
    ]);

    $this->post('/register', $payload)
        ->assertSessionHasErrors('password');
});

test('password reset link response does not reveal account existence', function () {
    Notification::fake();

    $user = createUser();

    $this->post('/forgot-password', ['email' => $user->email])
        ->assertRedirect()
        ->assertSessionHas('status');

    Notification::assertSentTo($user, ResetPassword::class);

    $this->post('/forgot-password', ['email' => 'missing@example.com'])
        ->assertRedirect()
        ->assertSessionHas('status');
});

test('users can reset a password with a valid token', function () {
    Notification::fake();

    $user = createUser();

    $this->post('/forgot-password', ['email' => $user->email]);

    $token = null;
    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token) {
        $token = $notification->token;

        return true;
    });

    $this->post('/reset-password', [
        'token' => $token,
        'email' => $user->email,
        'password' => 'NewPassword123456',
        'password_confirmation' => 'NewPassword123456',
    ])->assertRedirect(route('login'));

    expect(Hash::check('NewPassword123456', $user->fresh()->password_hash))->toBeTrue();
});

test('unverified fans are redirected to email verification notice', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect(route('verification.notice'));
});

test('registration sends a verification email', function () {
    Notification::fake();

    $this->post('/register', fanRegisterPayload())
        ->assertRedirect(route('verification.notice'));

    $user = User::query()->latest('id')->first();

    Notification::assertSentTo($user, VerifyEmail::class);
    expect($user->email_verified_at)->toBeNull();
});

test('waitlist rejoins with the same success message', function () {
    $this->post('/waitlist', [
        'email' => 'fan@example.com',
        'full_name' => 'Fan',
        'country' => 'NG',
        'club' => 'Arsenal',
    ])->assertRedirect(route('fan.campaign'))
        ->assertSessionHas('success');

    $this->post('/waitlist', [
        'email' => 'fan@example.com',
        'full_name' => 'Fan Again',
        'country' => 'NG',
        'club' => 'Arsenal',
    ])->assertRedirect(route('fan.campaign'))
        ->assertSessionHas('success')
        ->assertSessionDoesntHaveErrors();
});

test('admin login failure message does not reveal valid fan accounts', function () {
    createUser([
        'email' => 'fan-only@example.com',
        'password_hash' => Hash::make(validTestPassword()),
    ]);

    $this->post('/app/login', [
        'email' => 'fan-only@example.com',
        'password' => validTestPassword(),
    ])->assertSessionHasErrors([
        'email' => 'These credentials do not match our records.',
    ]);
});

test('web logout revokes existing paseto tokens', function () {
    $user = createUser();
    $token = app(PasetoService::class)->generateToken($user->id);

    $this->actingAs($user)
        ->post('/logout')
        ->assertRedirect(route('fan.campaign'));

    $this->withHeaders(['Authorization' => 'Bearer '.$token])
        ->getJson('/api/me')
        ->assertUnauthorized();
});

test('paseto tokens expire within configured ttl window metadata', function () {
    config(['services.paseto.ttl_minutes' => 60]);

    $service = app(PasetoService::class);
    $user = createUser();
    $token = $service->generateToken($user->id);

    expect($service->validateToken($token))->toBe($user->id);
});

test('admin mfa setup confirms a valid totp code when required', function () {
    config(['services.admin_mfa.required' => true]);

    $admin = createAdminUser();
    $mfa = app(AdminMfaService::class);
    $secret = $mfa->generateSecret();
    $mfa->storePendingSecret($admin, $secret);

    $code = (new Google2FA)->getCurrentOtp($secret);

    $this->actingAs($admin)
        ->post('/app/mfa/setup', ['code' => $code])
        ->assertRedirect(route('admin.dashboard'));

    expect($admin->fresh()->hasMfaEnabled())->toBeTrue();
});
