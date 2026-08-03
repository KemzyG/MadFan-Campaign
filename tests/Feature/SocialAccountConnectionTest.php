<?php

use App\Enums\SocialPlatform;
use App\Models\SocialAccount;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    requireSocialConnections();
});

test('guests are redirected from connect accounts page', function () {
    $this->get('/connect-accounts')->assertRedirect('/login');
});

test('authenticated users without required social accounts are redirected to connect accounts onboarding', function () {
    $user = createUser();

    $this->actingAs($user)
        ->get('/tasks')
        ->assertRedirect(route('fan.connect-accounts', ['onboarding' => 1]))
        ->assertSessionHas('onboarding_required', true);
});

test('users with required social accounts can access fan app pages', function () {
    $user = connectRequiredSocialAccounts(createUser());

    $this->actingAs($user)
        ->get('/tasks')
        ->assertSuccessful();
});

test('users can manually connect x and discord accounts', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = createUser(['handle' => '@testfan']);

    $this->actingAs($user)
        ->post('/connect-accounts/verify', [
            '_token' => csrf_token(),
            'platform' => SocialPlatform::X->value,
            'identifier' => '@testfan',
        ])
        ->assertRedirect(route('fan.connect-accounts'));

    expect(SocialAccount::query()->where('user_id', $user->id)->where('platform', SocialPlatform::X)->exists())
        ->toBeTrue();

    $this->actingAs($user)
        ->post('/connect-accounts/verify', [
            '_token' => csrf_token(),
            'platform' => SocialPlatform::Discord->value,
            'identifier' => 'testfan',
        ])
        ->assertRedirect(route('fan.connect-accounts'));

    expect(SocialAccount::query()->where('user_id', $user->id)->where('platform', SocialPlatform::Discord)->exists())
        ->toBeTrue();
});

test('users cannot disconnect required social accounts', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = connectRequiredSocialAccounts(createUser());

    $this->actingAs($user)
        ->delete('/connect-accounts/x', ['_token' => csrf_token()])
        ->assertSessionHasErrors('platform');
});

test('users can disconnect optional telegram accounts', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = connectRequiredSocialAccounts(createUser());
    SocialAccount::factory()->telegram()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete('/connect-accounts/telegram', ['_token' => csrf_token()])
        ->assertRedirect(route('fan.connect-accounts'));

    expect(SocialAccount::query()->where('user_id', $user->id)->where('platform', SocialPlatform::Telegram)->exists())
        ->toBeFalse();
});

test('users can manually connect telegram with username verification', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    config([
        'services.telegram.bot_token' => 'test-token',
        'services.telegram.channel_username' => '@madfan',
    ]);

    Http::fake(function ($request) {
        if (str_contains($request->url(), 'getChatMember')) {
            return Http::response([
                'ok' => true,
                'result' => ['status' => 'member'],
            ]);
        }

        return Http::response([
            'ok' => true,
            'result' => ['id' => 555, 'username' => 'tgfan'],
        ]);
    });

    $user = connectRequiredSocialAccounts(createUser());

    $this->actingAs($user)
        ->post('/connect-accounts/verify', [
            '_token' => csrf_token(),
            'platform' => SocialPlatform::Telegram->value,
            'identifier' => '@tgfan',
        ])
        ->assertRedirect(route('fan.connect-accounts'));

    $account = SocialAccount::query()
        ->where('user_id', $user->id)
        ->where('platform', SocialPlatform::Telegram)
        ->first();

    expect($account)->not->toBeNull()
        ->and($account->platform_user_id)->toBe('555')
        ->and($account->username)->toBe('@tgfan');
});

test('users cannot connect telegram when username is not in the channel', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    config([
        'services.telegram.bot_token' => 'test-token',
        'services.telegram.channel_username' => '@madfan',
    ]);

    Http::fake(function ($request) {
        if (str_contains($request->url(), 'getChatMember')) {
            return Http::response([
                'ok' => true,
                'result' => ['status' => 'left'],
            ]);
        }

        return Http::response([
            'ok' => true,
            'result' => ['id' => 555, 'username' => 'tgfan'],
        ]);
    });

    $user = connectRequiredSocialAccounts(createUser());

    $this->actingAs($user)
        ->post('/connect-accounts/verify', [
            '_token' => csrf_token(),
            'platform' => SocialPlatform::Telegram->value,
            'identifier' => '@tgfan',
        ])
        ->assertSessionHasErrors('identifier');

    expect(SocialAccount::query()->where('user_id', $user->id)->where('platform', SocialPlatform::Telegram)->exists())
        ->toBeFalse();
});

test('onboarding connect accounts page is accessible for authenticated users', function () {
    $user = createUser();

    $this->actingAs($user)
        ->get('/connect-accounts?onboarding=1')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/ConnectAccounts')
            ->where('onboarding', true));
});

test('connect accounts page exposes platform status', function () {
    $user = connectRequiredSocialAccounts(createUser());

    $this->actingAs($user)
        ->get('/connect-accounts?manage=1')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/ConnectAccounts')
            ->where('required_complete', true)
            ->has('accounts', 3));
});

test('manual connect from onboarding redirects back to connect accounts', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = createUser(['handle' => '@regfan']);

    $this->actingAs($user)
        ->post('/connect-accounts/verify', [
            '_token' => csrf_token(),
            'platform' => SocialPlatform::X->value,
            'identifier' => '@regfan',
            'return_to' => 'onboarding',
        ])
        ->assertRedirect(route('fan.connect-accounts', ['onboarding' => 1]));
});

test('manual connect from passport redirects back to passport', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = createUser(['handle' => '@passportfan']);

    $this->actingAs($user)
        ->post('/connect-accounts/verify', [
            '_token' => csrf_token(),
            'platform' => SocialPlatform::X->value,
            'identifier' => '@passportfan',
            'return_to' => 'passport',
        ])
        ->assertRedirect(route('fan.passport'));
});
