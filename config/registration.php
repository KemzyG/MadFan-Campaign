<?php

return [

    /*
    |--------------------------------------------------------------------------
    | One account per identity
    |--------------------------------------------------------------------------
    |
    | Blocks additional signups from the same device fingerprint, registration
    | lock cookie, IP address, or normalized email (Gmail aliases / dots).
    |
    */

    'enforce_one_account' => env('REGISTRATION_ENFORCE_ONE_ACCOUNT', true),

    'require_fingerprint' => env('REGISTRATION_REQUIRE_FINGERPRINT', true),

    'unique_fingerprint' => env('REGISTRATION_UNIQUE_FINGERPRINT', true),

    'unique_ip' => env('REGISTRATION_UNIQUE_IP', false),

    /*
    | Lifetime IP uniqueness when unique_ip is true. Set hours to only block
    | repeats within a window (e.g. 24) for shared CGNAT networks.
    | null = forever (strict one account per IP).
    */
    'ip_lookback_hours' => env('REGISTRATION_IP_LOOKBACK_HOURS', 24),

    'lock_cookie' => env('REGISTRATION_LOCK_COOKIE', 'mf_reg_lock'),

    'lock_cookie_days' => (int) env('REGISTRATION_LOCK_COOKIE_DAYS', 3650),

];
