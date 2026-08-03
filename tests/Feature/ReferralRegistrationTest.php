<?php

use App\Models\Referral;
use App\Models\User;
use App\Models\Waitlist;
use App\Services\ReferralService;
use Database\Seeders\SeasonSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
});

test('referral link stores referrer in session and redirects to campaign', function () {
    $referrer = createUser(['fan_id' => 'MF-REF01']);

    $this->get('/r/MF-REF01')
        ->assertRedirect(route('fan.campaign'))
        ->assertSessionHas(ReferralService::SESSION_KEY, 'MF-REF01');

    $this->get('/')
        ->assertInertia(fn ($page) => $page->where('fanNav.referrer_fan_id', 'MF-REF01'));
});

test('invalid referral link redirects with error', function () {
    $this->get('/r/MF-NOPE')
        ->assertRedirect(route('fan.campaign'))
        ->assertSessionHas('error');
});

test('self referral is ignored when referrer and referred are the same user', function () {
    $user = createUser([
        'fan_id' => 'MF-SELF1',
        'referral_count' => 0,
        'total_points' => 0,
    ]);

    $result = app(ReferralService::class)->attributeReferral($user, 'MF-SELF1');

    expect($result)->toBeNull()
        ->and(Referral::count())->toBe(0)
        ->and($user->fresh()->referral_count)->toBe(0);
});

test('logged in user visiting own referral link does not store referrer', function () {
    $user = createUser(['fan_id' => 'MF-OWN01']);

    $this->actingAs($user)
        ->get('/r/MF-OWN01')
        ->assertRedirect(route('fan.campaign'))
        ->assertSessionMissing(ReferralService::SESSION_KEY);
});

test('fan registration attributes referral and awards referrer points', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $referrer = createUser([
        'fan_id' => 'MF-GIVE1',
        'referral_count' => 0,
        'total_points' => 100,
    ]);

    $this->get('/r/MF-GIVE1')->assertRedirect(route('fan.campaign'));

    $this->post('/register', fanRegisterPayload([
        'name' => 'Referred Fan',
        'email' => 'referred@madfan.test',
        'club' => 'Liverpool FC',
    ]))->assertRedirect(route('verification.notice'));

    $referrer->refresh();
    $referred = User::query()->where('email', 'referred@madfan.test')->first();

    expect($referrer->referral_count)->toBe(1);
    expect($referrer->total_points)->toBe(600);

    $referral = Referral::query()->where('referrer_user_id', $referrer->id)->first();

    expect($referral)->not->toBeNull()
        ->and($referral->referred_user_id)->toBe($referred->id)
        ->and($referral->status)->toBe('rewarded')
        ->and($referral->points_awarded)->toBe(ReferralService::REFERRAL_POINTS);
});

test('duplicate referral is not created for the same referred user', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $referrer = createUser(['fan_id' => 'MF-DUP01', 'referral_count' => 0, 'total_points' => 0]);
    $otherReferrer = createUser(['fan_id' => 'MF-DUP02', 'referral_count' => 0, 'total_points' => 0]);

    $this->withSession([ReferralService::SESSION_KEY => 'MF-DUP01']);

    $this->post('/register', fanRegisterPayload([
        'name' => 'Already Referred',
        'email' => 'dup@madfan.test',
        'club' => 'Chelsea FC',
    ]));

    $this->withSession([ReferralService::SESSION_KEY => 'MF-DUP02']);

    app(ReferralService::class)->attributeReferral(
        User::query()->where('email', 'dup@madfan.test')->firstOrFail(),
        'MF-DUP02',
    );

    expect(Referral::count())->toBe(1);
    expect($otherReferrer->fresh()->referral_count)->toBe(0);
});

test('waitlist signup records referral source from session', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    createUser(['fan_id' => 'MF-WAIT1']);

    $this->get('/r/MF-WAIT1');

    $this->post('/waitlist', [
        'email' => 'waitlist-ref@madfan.test',
    ])->assertRedirect(route('fan.campaign'));

    $waitlist = Waitlist::query()->where('email', 'waitlist-ref@madfan.test')->first();

    expect($waitlist)->not->toBeNull()
        ->and($waitlist->source)->toBe('referral:MF-WAIT1');
});

test('api registration attributes referral via referrer_fan_id', function () {
    $referrer = createUser([
        'fan_id' => 'MF-API1',
        'referral_count' => 0,
        'total_points' => 0,
    ]);

    $this->postJson('/api/register', [
        'name' => 'API Fan',
        'email' => 'api-ref@madfan.test',
        'username' => 'apiref',
        'password' => validTestPassword(),
        'password_confirmation' => validTestPassword(),
        'referrer_fan_id' => 'MF-API1',
        'device_fingerprint' => deviceFingerprint('api-ref-1'),
    ])->assertCreated();

    expect($referrer->fresh()->referral_count)->toBe(1)
        ->and($referrer->fresh()->total_points)->toBe(ReferralService::REFERRAL_POINTS);
});

test('waitlist entry links to user after referred registration', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    createUser(['fan_id' => 'MF-LINK1']);

    $this->get('/r/MF-LINK1');

    $this->post('/waitlist', ['email' => 'linked@madfan.test']);

    $this->post('/register', fanRegisterPayload([
        'name' => 'Linked Fan',
        'email' => 'linked@madfan.test',
        'club' => 'Arsenal FC',
    ]));

    $user = User::query()->where('email', 'linked@madfan.test')->first();
    $waitlist = Waitlist::query()->where('email', 'linked@madfan.test')->first();

    expect($waitlist->user_id)->toBe($user->id);
});
