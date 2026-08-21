<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Mad Fan marketing landing media
    |--------------------------------------------------------------------------
    |
    | Source PNGs live in resources/images/landing and are pushed to Cloudinary
    | with stable public_ids via `php artisan madfan:sync-landing-media`.
    | Redeploys do not delete Cloudinary assets; re-running the command
    | overwrites the same public_ids so URLs stay durable.
    |
    */

    'folder' => env('LANDING_CLOUDINARY_FOLDER', 'madfan/landing'),

    'assets' => [
        'hero' => [
            'file' => 'hero.png',
            'public_id' => 'madfan/landing/hero',
            'alt' => 'Mad Fan matchday kit under floodlights',
            'role' => 'hero',
        ],
        'campaign' => [
            'file' => 'campaign.png',
            'public_id' => 'madfan/landing/campaign',
            'alt' => 'Season campaign loyalty passport and fan identity',
            'role' => 'category',
        ],
        'social' => [
            'file' => 'social.png',
            'public_id' => 'madfan/landing/social',
            'alt' => 'Terrace social — club feed and matchday chat',
            'role' => 'category',
        ],
        'shop' => [
            'file' => 'shop.png',
            'public_id' => 'madfan/landing/shop',
            'alt' => 'Jersey kit room product photography',
            'role' => 'category',
        ],
        'passport' => [
            'file' => 'passport.png',
            'public_id' => 'madfan/landing/passport',
            'alt' => 'Fan passport — loyalty score as identity',
            'role' => 'category',
        ],
        'kit_home' => [
            'file' => 'kit-home.png',
            'public_id' => 'madfan/landing/kit-home',
            'alt' => 'Featured home kit',
            'role' => 'kit',
            'label' => 'Home kit',
        ],
        'kit_away' => [
            'file' => 'kit-away.png',
            'public_id' => 'madfan/landing/kit-away',
            'alt' => 'Featured away kit',
            'role' => 'kit',
            'label' => 'Away layer',
        ],
        'kit_training' => [
            'file' => 'kit-training.png',
            'public_id' => 'madfan/landing/kit-training',
            'alt' => 'Featured training shell',
            'role' => 'kit',
            'label' => 'Training shell',
        ],
    ],

];
