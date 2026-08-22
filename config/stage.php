<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Mad Fan Stage room backgrounds
    |--------------------------------------------------------------------------
    |
    | Source PNGs live in resources/images/stage and are pushed to Cloudinary
    | with stable public_ids via `php artisan madfan:sync-media`. Deploy startup
    | uploads only when an asset is missing or the committed PNG bytes changed.
    |
    */

    'folder' => env('STAGE_CLOUDINARY_FOLDER', 'madfan/stage'),

    'backgrounds' => [
        1 => [
            'file' => 'stage-bg-1.png',
            'public_id' => 'madfan/stage/stage-bg-1',
            'alt' => 'Floodlit night match stadium atmosphere',
            'label' => 'Floodlights',
        ],
        2 => [
            'file' => 'stage-bg-2.png',
            'public_id' => 'madfan/stage/stage-bg-2',
            'alt' => 'Golden sunset stadium atmosphere',
            'label' => 'Sunset',
        ],
        3 => [
            'file' => 'stage-bg-3.png',
            'public_id' => 'madfan/stage/stage-bg-3',
            'alt' => 'Packed crowd match night atmosphere',
            'label' => 'Crowd',
        ],
        4 => [
            'file' => 'stage-bg-4.png',
            'public_id' => 'madfan/stage/stage-bg-4',
            'alt' => 'Training ground dusk atmosphere',
            'label' => 'Training ground',
        ],
    ],

];
