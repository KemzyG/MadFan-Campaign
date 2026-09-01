<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Admin host (Filament + Inertia console)
    |--------------------------------------------------------------------------
    |
    | Leave empty locally so admin routes live on APP_URL under /ops.
    | In production set to the admin subdomain host only, e.g. ops.example.com
    | (no scheme). When set, the Inertia console mounts at the host root
    | (https://ops.example.com/) unless ADMIN_APP_PATH overrides it.
    |
    */

    'domain' => env('ADMIN_DOMAIN') ?: null,

    'filament_domain' => env('FILAMENT_DOMAIN') ?: env('ADMIN_DOMAIN') ?: null,

    'app_domain' => env('ADMIN_APP_DOMAIN') ?: env('ADMIN_DOMAIN') ?: null,

    /*
    |--------------------------------------------------------------------------
    | URL path prefixes
    |--------------------------------------------------------------------------
    */

    'filament_path' => trim((string) env('FILAMENT_PATH', 'admin'), '/'),

    /*
    | Empty string = mount at domain root (default when ADMIN_DOMAIN is set).
    | "ops" = /ops prefix (default on the main APP_URL host).
    */
    'app_path' => ($explicit = env('ADMIN_APP_PATH')) !== null
        ? trim((string) $explicit, '/')
        : (env('ADMIN_DOMAIN') ? '' : 'ops'),

];
