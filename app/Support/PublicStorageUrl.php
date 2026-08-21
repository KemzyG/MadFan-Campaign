<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Same-origin public disk URLs (and passthrough for remote CDN URLs).
 *
 * Avoids CORS failures when APP_URL is localhost but the browser
 * is on 127.0.0.1 (or the reverse) — Storage::url() embeds APP_URL.
 *
 * Empty / missing local paths resolve to the configured Cloudinary
 * (or local) default thumbnail so the UI never receives a blank URL.
 */
class PublicStorageUrl
{
    /**
     * Public URL for a stored image path, or the default thumbnail when
     * the path is empty, or a relative local file is missing on disk.
     *
     * Absolute http(s) URLs (Cloudinary or otherwise) pass through unchanged.
     */
    public static function path(?string $path): string
    {
        if (! filled($path)) {
            return self::defaultImageUrl();
        }

        if (CloudinaryImageStorage::isRemoteUrl($path)) {
            return $path;
        }

        $normalized = ltrim(str_replace('\\', '/', $path), '/');

        if (! Storage::disk('public')->exists($normalized)) {
            return self::defaultImageUrl();
        }

        return '/storage/'.$normalized;
    }

    /**
     * Relative web path for a public asset (not necessarily on the public disk).
     */
    public static function asset(string $path): string
    {
        return '/'.ltrim(str_replace('\\', '/', $path), '/');
    }

    /**
     * Configured default thumbnail (Cloudinary delivery URL or local asset).
     */
    public static function defaultImageUrl(): string
    {
        return CloudinaryImageStorage::defaultImageUrl();
    }
}
