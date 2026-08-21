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

    /*
    |--------------------------------------------------------------------------
    | Default thumbnail
    |--------------------------------------------------------------------------
    |
    | Used when an image path is null, empty, or a local file is missing.
    | Accepts a Cloudinary public_id (e.g. madfan/defaults/thumbnail) or a
    | full https URL. Delivery URLs only need the cloud name (upload
    | credentials are not required to serve the default).
    |
    | When neither a usable default nor cloud name is available, the local
    | public asset below is used instead.
    |
    */

    'default_image' => env('CLOUDINARY_DEFAULT_IMAGE', 'madfan/defaults/thumbnail'),

    'local_default_image' => env('CLOUDINARY_LOCAL_DEFAULT_IMAGE', 'default-avatar.png'),

    /*
    |--------------------------------------------------------------------------
    | Image Generation (text-to-image)
    |--------------------------------------------------------------------------
    |
    | Requires the Cloudinary Image Generation add-on. When credentials are
    | missing, admin generate endpoints return a clear configuration error
    | (uploads still fall back to the local public disk).
    |
    */

    'generation_model' => env('CLOUDINARY_GENERATION_MODEL'),

    'generation_timeout' => (int) env('CLOUDINARY_GENERATION_TIMEOUT', 90),

];
