<?php

use App\Services\TelegramService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Config::set('services.telegram.bot_token', 'test-token');
    Config::set('services.telegram.channel_username', '@madfan');
    Config::set('services.social.allow_mock_verification', false);
});

test('it verifies telegram usernames by resolving user id and checking channel membership', function () {
    Http::fake(function ($request) {
        if (str_contains($request->url(), 'getChatMember')) {
            return Http::response([
                'ok' => true,
                'result' => ['status' => 'member'],
            ]);
        }

        if (str_contains($request->url(), 'getChat')) {
            return Http::response([
                'ok' => true,
                'result' => ['id' => 123456789, 'username' => 'testfan'],
            ]);
        }

        return Http::response(['ok' => false], 400);
    });

    $member = app(TelegramService::class)->resolveChannelMember('@testfan');

    expect($member)->toBe([
        'user_id' => '123456789',
        'username' => '@testfan',
    ]);
});

test('it rejects telegram users that are not in the channel', function () {
    Http::fake(function ($request) {
        if (str_contains($request->url(), 'getChatMember')) {
            return Http::response([
                'ok' => true,
                'result' => ['status' => 'left'],
            ]);
        }

        return Http::response([
            'ok' => true,
            'result' => ['id' => 123456789, 'username' => 'testfan'],
        ]);
    });

    expect(app(TelegramService::class)->resolveChannelMember('testfan'))->toBeNull();
});

test('it rejects unknown telegram usernames', function () {
    Http::fake([
        'api.telegram.org/bot*/getChat*' => Http::response(['ok' => false, 'description' => 'Not Found'], 400),
    ]);

    expect(app(TelegramService::class)->resolveChannelMember('@unknown'))->toBeNull();
});

test('it accepts numeric telegram user ids when they are channel members', function () {
    Http::fake(function ($request) {
        if (str_contains($request->url(), 'getChatMember')) {
            return Http::response([
                'ok' => true,
                'result' => ['status' => 'member'],
            ]);
        }

        return Http::response(['ok' => false], 400);
    });

    $member = app(TelegramService::class)->resolveChannelMember('987654321');

    expect($member)->toBe([
        'user_id' => '987654321',
        'username' => null,
    ]);
});
