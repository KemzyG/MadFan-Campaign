<?php

use App\Models\User;
use App\Support\ApplicationSettings;
use App\Support\SocialRouting;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;

test('unverified fans can access the dashboard when email verification is disabled', function () {
    config(['auth.email_verification_enabled' => false]);

    $user = User::factory()->unverified()->create([
        'total_points' => 0,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Fan/Dashboard'));
});

test('unverified fans can open social onboarding when email verification is disabled', function () {
    config(['auth.email_verification_enabled' => false]);
    ApplicationSettings::sync(['social_network_enabled' => 'true']);

    $user = User::factory()->unverified()->create([
        'social_onboarded_at' => null,
        'favourite_club_id' => null,
    ]);

    $this->actingAs($user)
        ->get(route('social.onboarding.club'))
        ->assertOk();
});

test('registration skips verification mail and lands in social when disabled', function () {
    config([
        'auth.email_verification_enabled' => false,
        'registration.unique_ip' => false,
    ]);
    ApplicationSettings::sync(['social_verification_required' => 'false']);
    Notification::fake();

    $this->post('/register', fanRegisterPayload([
        'email' => 'skip-verify@madfan.test',
        'device_fingerprint' => deviceFingerprint('skip-verify-device'),
    ]))->assertRedirect(SocialRouting::url('/'));

    $this->assertAuthenticated();

    $user = User::query()->where('email', 'skip-verify@madfan.test')->first();

    expect($user)->not->toBeNull()
        ->and($user->email_verified_at)->toBeNull()
        ->and($user->hasVerifiedEmail())->toBeTrue();

    Notification::assertNotSentTo($user, VerifyEmail::class);
});

test('unverified fans are still gated when email verification is enabled', function () {
    config(['auth.email_verification_enabled' => true]);

    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect(route('verification.notice'));
});
