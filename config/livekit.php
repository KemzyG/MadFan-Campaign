<?php

/**
 * LiveKit Cloud (or self-hosted) for Mad Fan Stage voice media.
 * The Laravel app only mints participant JWTs — media runs on LiveKit, not in the PHP container.
 *
 * Env (LiveKit Cloud project settings):
 *   LIVEKIT_URL=wss://your-project.livekit.cloud
 *   LIVEKIT_API_KEY=...
 *   LIVEKIT_API_SECRET=...
 *
 * STAGE_VOICE_DRIVER=auto|livekit|mesh
 *   auto (default) — LiveKit when credentials are present, else mesh WebRTC
 */
return [

    'driver' => env('STAGE_VOICE_DRIVER', 'auto'),

    /*
    | WebSocket URL from LiveKit Cloud project settings (wss://….livekit.cloud).
    | LIVEKIT_HOST is accepted as an alias for older env naming.
    */
    'url' => env('LIVEKIT_URL', env('LIVEKIT_HOST')),

    'api_key' => env('LIVEKIT_API_KEY'),

    'api_secret' => env('LIVEKIT_API_SECRET'),

    /*
    | Access token lifetime in seconds (initial join only; LiveKit refreshes while connected).
    */
    'token_ttl' => (int) env('LIVEKIT_TOKEN_TTL', 3600),

];
