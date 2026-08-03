<?php

use App\Services\DiscordService;
use App\Services\TelegramService;
use App\Services\TwitterService;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

uses(TestCase::class);

test('twitter verification fails closed when bearer token is missing', function () {
    Config::set('services.twitter.bearer_token', null);
    Config::set('services.social.allow_mock_verification', false);

    expect(app(TwitterService::class)->verifyFollowUser('@fan'))->toBeFalse();
});

test('discord verification fails closed when credentials are missing', function () {
    Config::set('services.discord.bot_token', null);
    Config::set('services.discord.guild_id', null);
    Config::set('services.social.allow_mock_verification', false);

    expect(app(DiscordService::class)->verifyJoinServer('12345'))->toBeFalse();
});

test('telegram verification fails closed when bot token is missing', function () {
    Config::set('services.telegram.bot_token', null);
    Config::set('services.social.allow_mock_verification', false);

    expect(app(TelegramService::class)->resolveChannelMember('@fan'))->toBeNull();
});

test('social verification may mock only when explicitly allowed', function () {
    Config::set('services.twitter.bearer_token', null);
    Config::set('services.social.allow_mock_verification', true);

    expect(app(TwitterService::class)->verifyFollowUser('@fan'))->toBeTrue();
});
