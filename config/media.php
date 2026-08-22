<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Static media catalogs (deploy sync)
    |--------------------------------------------------------------------------
    |
    | Committed source assets with stable Cloudinary public_ids. Synced on deploy
    | via `php artisan madfan:sync-media` (uploads only when missing or changed).
    | User-generated admin gallery content is intentionally excluded.
    |
    */

    'catalogs' => [
        'landing' => [
            'label' => 'Landing page PNGs',
            'config_key' => 'landing.assets',
            'source_root' => 'resources/images/landing',
        ],
        'stage' => [
            'label' => 'Stage room backgrounds',
            'config_key' => 'stage.backgrounds',
            'source_root' => 'resources/images/stage',
        ],
    ],

];
