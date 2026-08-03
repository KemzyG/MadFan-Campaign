<?php

use App\Models\User;
use App\Services\RegistrationIdentityGuard;
use App\Services\RegistrationNotificationService;
use App\Support\ApplicationSettings;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    $this->withoutMiddleware(PreventRequestForgery::class);
    config([
        'registration.enforce_one_account' => true,
        'registration.require_fingerprint' => true,
        'registration.unique_fingerprint' => true,
        'registration.unique_ip' => true,
        'registration.ip_lookback_hours' => null,
    ]);
});

test('registration stores fingerprint ip and normalized email', function () {
    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
        ->post('/register', fanRegisterPayload([
            'email' => 'First.User+tag@gmail.com',
            'device_fingerprint' => deviceFingerprint('device-a'),
        ]))
        ->assertRedirect();

    $user = User::query()->where('email', 'First.User+tag@gmail.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->email_normalized)->toBe('firstuser@gmail.com')
        ->and($user->registration_fingerprint)->toBe(
            app(RegistrationIdentityGuard::class)->hashFingerprint(deviceFingerprint('device-a'))
        )
        ->and($user->registration_ip)->toBe('203.0.113.10');
});

test('same device fingerprint cannot register a second account', function () {
    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.11'])
        ->post('/register', fanRegisterPayload([
            'email' => 'one@madfan.test',
            'device_fingerprint' => deviceFingerprint('same-device'),
        ]))
        ->assertRedirect();

    Auth::logout();
    $this->flushSession();

    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.12'])
        ->from('/register')
        ->post('/register', fanRegisterPayload([
            'email' => 'two@madfan.test',
            'device_fingerprint' => deviceFingerprint('same-device'),
        ]))
        ->assertRedirect('/register')
        ->assertSessionHasErrors(['registration']);
});

test('same ip cannot register a second account', function () {
    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.20'])
        ->post('/register', fanRegisterPayload([
            'email' => 'ip-one@madfan.test',
            'device_fingerprint' => deviceFingerprint('device-ip-1'),
        ]))
        ->assertRedirect();

    Auth::logout();
    $this->flushSession();

    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.20'])
        ->from('/register')
        ->post('/register', fanRegisterPayload([
            'email' => 'ip-two@madfan.test',
            'device_fingerprint' => deviceFingerprint('device-ip-2'),
        ]))
        ->assertRedirect('/register')
        ->assertSessionHasErrors(['registration']);
});

test('gmail alias of an existing account is rejected', function () {
    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.30'])
        ->post('/register', fanRegisterPayload([
            'email' => 'fan.name@gmail.com',
            'device_fingerprint' => deviceFingerprint('gmail-1'),
        ]))
        ->assertRedirect();

    Auth::logout();
    $this->flushSession();

    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.31'])
        ->from('/register')
        ->post('/register', fanRegisterPayload([
            'email' => 'fanname+promo@gmail.com',
            'device_fingerprint' => deviceFingerprint('gmail-2'),
        ]))
        ->assertRedirect('/register')
        ->assertSessionHasErrors(['email']);
});

test('registration lock cookie blocks a second signup from the same browser', function () {
    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.40'])
        ->post('/register', fanRegisterPayload([
            'email' => 'cookie-fan@madfan.test',
            'device_fingerprint' => deviceFingerprint('cookie-device-1'),
        ]))
        ->assertRedirect();

    $user = User::query()->where('email', 'cookie-fan@madfan.test')->firstOrFail();
    $cookie = app(RegistrationIdentityGuard::class)->makeLockCookie($user);

    Auth::logout();
    $this->flushSession();

    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.41'])
        ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
        ->from('/register')
        ->post('/register', fanRegisterPayload([
            'email' => 'cookie-fan-2@madfan.test',
            'device_fingerprint' => deviceFingerprint('cookie-device-2'),
        ]))
        ->assertRedirect('/register')
        ->assertSessionHasErrors(['registration']);
});

test('api registration requires a device fingerprint', function () {
    $this->postJson('/api/register', [
        'name' => 'API Fan',
        'email' => 'apinoFp@madfan.test',
        'username' => 'apinopf',
        'password' => validTestPassword(),
        'password_confirmation' => validTestPassword(),
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['device_fingerprint']);
});

test('register page stays on register with a sign-in CTA when lock cookie is present', function () {
    $user = createUser();
    $cookie = app(RegistrationIdentityGuard::class)->makeLockCookie($user);

    $this->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
        ->get('/register')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Auth/Register')
            ->where('registration_blocked', true)
            ->where('registration_blocked_message', 'This device already has a Mad Fan account. Sign in to finish connecting your accounts or continue.'));
});

test('welcome email failures are swallowed so registration is not blocked', function () {
    ApplicationSettings::sync([
        'send_registration_welcome_email' => 'true',
    ]);

    Mail::shouldReceive('to')
        ->once()
        ->andThrow(new RuntimeException('SMTP down'));

    $service = app(RegistrationNotificationService::class);
    $user = createUser(['email' => 'mailfail-'.uniqid().'@madfan.test']);

    $service->sendWelcomeEmail($user);

    expect(true)->toBeTrue();
});

test('successful registration authenticates before redirecting to email verification', function () {
    requireSocialConnections();

    config([
        'registration.unique_ip' => false,
    ]);

    $this->post('/register', fanRegisterPayload([
        'email' => 'finish-reg@madfan.test',
        'device_fingerprint' => deviceFingerprint('finish-reg-device'),
    ]))
        ->assertRedirect(route('verification.notice'));

    $this->assertAuthenticated();
    expect(Auth::user()->email)->toBe('finish-reg@madfan.test');
});
