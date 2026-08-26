<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'social' => [
        'allow_mock_verification' => env('SOCIAL_ALLOW_MOCK_VERIFICATION', false),
    ],

    'paseto' => [
        'ttl_minutes' => (int) env('PASETO_TTL_MINUTES', 60 * 24),

        // Base64-encoded 32-byte PASETO v3.local key that encrypts chat message
        // bodies at rest. Deliberately separate from the auth-token key above —
        // rotating/compromising one must never affect the other. MUST be set in
        // production (and identical across every app instance): without it, each
        // server falls back to its own auto-generated key file under
        // storage/app/, and any messages encrypted by one instance become
        // permanently undecryptable on another, or after a redeploy that wipes
        // local storage. Generate one with:
        //   php artisan tinker --execute="echo base64_encode(random_bytes(32));"
        'chat_key' => env('CHAT_ENCRYPTION_KEY'),
    ],

    'admin_mfa' => [
        'required' => env('ADMIN_MFA_REQUIRED', true),
    ],

    'discord' => [
        'bot_token' => env('DISCORD_BOT_TOKEN'),
        'guild_id' => env('DISCORD_GUILD_ID'),
        'client_id' => env('DISCORD_CLIENT_ID'),
        'client_secret' => env('DISCORD_CLIENT_SECRET'),
    ],

    'twitter' => [
        'bearer_token' => env('TWITTER_BEARER_TOKEN'),
        'username' => env('TWITTER_TARGET_USERNAME', 'madfan'),
        'client_id' => env('TWITTER_CLIENT_ID'),
        'client_secret' => env('TWITTER_CLIENT_SECRET'),
    ],

    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'channel_username' => env('TELEGRAM_CHANNEL_USERNAME', '@madfan'),
        'bot_username' => env('TELEGRAM_BOT_USERNAME'),
    ],

];
