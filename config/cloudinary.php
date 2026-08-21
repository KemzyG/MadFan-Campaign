<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cloudinary credentials
    |--------------------------------------------------------------------------
    |
    | Prefer CLOUDINARY_URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME).
    | Individual CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET vars also work.
    | When credentials are missing, uploads fall back to the local public disk.
    |
    */

    'cloud_url' => env('CLOUDINARY_URL'),

    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),

    'api_key' => env('CLOUDINARY_API_KEY'),

    'api_secret' => env('CLOUDINARY_API_SECRET'),

    'upload_preset' => env('CLOUDINARY_UPLOAD_PRESET'),

    /*
    |--------------------------------------------------------------------------
    | Folder prefix
    |--------------------------------------------------------------------------
    |
    | Prefixed onto per-feature folders (avatars, posts, jerseys, brands, …).
    |
    */

    'folder' => env('CLOUDINARY_FOLDER', 'madfan'),

];
