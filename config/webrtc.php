<?php

/**
 * Browser WebRTC ICE configuration for Mad Fan Stage (mesh).
 * TURN credentials are exposed to the client by design (browser ICE).
 * Prefer short-lived / app-scoped TURN accounts (Metered, Twilio, self-hosted coturn).
 */
return [

    /*
    | Comma-separated STUN urls. Defaults cover most residential NATs for host discovery.
    */
    'stun_urls' => array_values(array_filter(array_map(
        static fn (string $url): string => trim($url),
        explode(',', (string) env(
            'RTC_STUN_URLS',
            'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302',
        )),
    ))),

    /*
    | Comma-separated TURN / TURNS urls (e.g. turn:x.metered.ca:80,turns:x.metered.ca:443).
    | When set with username+credential, public Open Relay fallback is skipped.
    */
    'turn_urls' => array_values(array_filter(array_map(
        static fn (string $url): string => trim($url),
        explode(',', (string) env('RTC_TURN_URLS', '')),
    ))),

    'turn_username' => env('RTC_TURN_USERNAME'),

    'turn_credential' => env('RTC_TURN_CREDENTIAL'),

    /*
    | When custom TURN is empty, use Metered Open Relay public trial credentials so
    | symmetric NAT / mobile clients can still hear Stage voice. Disable with RTC_USE_PUBLIC_TURN=false.
    */
    'use_public_turn_fallback' => filter_var(
        env('RTC_USE_PUBLIC_TURN', true),
        FILTER_VALIDATE_BOOL,
    ),

    'public_turn' => [
        'urls' => [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:80?transport=tcp',
            'turn:openrelay.metered.ca:443',
            'turns:openrelay.metered.ca:443?transport=tcp',
        ],
        'username' => 'openrelayproject',
        'credential' => 'openrelayproject',
    ],

];
