<?php

namespace App\Support;

/**
 * Same-origin public disk URLs.
 *
 * Avoids CORS failures when APP_URL is localhost but the browser
 * is on 127.0.0.1 (or the reverse) — Storage::url() embeds APP_URL.
 */
class PublicStorageUrl
{
    /**
     * Relative web path for a file on the public disk.
     */
    public static function path(string $path): string
    {
        $normalized = ltrim(str_replace('\\', '/', $path), '/');

        return '/storage/'.$normalized;
    }

    /**
     * Relative web path for a public asset (not necessarily on the public disk).
     */
    public static function asset(string $path): string
    {
        return '/'.ltrim(str_replace('\\', '/', $path), '/');
    }
}
