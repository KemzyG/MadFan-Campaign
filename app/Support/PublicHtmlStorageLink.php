<?php

namespace App\Support;

/**
 * Wire public_html/storage for cPanel (prefer symlink; optional copy fallback).
 */
class PublicHtmlStorageLink
{
    /**
     * @return array{ok: bool, mode: string, message: string, path: string}
     */
    public static function ensure(string $webRoot, string $applicationPath, bool $allowMirror = false): array
    {
        $link = rtrim($webRoot, '/\\').DIRECTORY_SEPARATOR.'storage';
        $target = rtrim($applicationPath, '/\\').DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR.'app'.DIRECTORY_SEPARATOR.'public';

        if (! is_dir($target)) {
            mkdir($target, 0755, true);
        }

        if (is_link($link)) {
            $current = readlink($link) ?: '';

            return [
                'ok' => true,
                'mode' => 'symlink',
                'message' => "public_html/storage is already a symlink → {$current}",
                'path' => $link,
            ];
        }

        if (file_exists($link) || is_dir($link)) {
            // Real directory (stale copy) blocks a proper symlink.
            if (! $allowMirror) {
                return [
                    'ok' => false,
                    'mode' => 'directory',
                    'message' => 'public_html/storage is a real folder (copy), not a symlink. Rename it to storage-old in File Manager, then re-run with ?link=1. New uploads will not show until this is fixed.',
                    'path' => $link,
                ];
            }

            // Mirror into existing directory only when explicitly requested.
            $mirror = PublicStorageWebMirror::mirrorTo($link);

            return [
                'ok' => true,
                'mode' => 'mirror',
                'message' => "Mirrored {$mirror['copied']} file(s) into existing public_html/storage (copy mode — re-run after each upload).",
                'path' => $link,
            ];
        }

        if (@symlink($target, $link)) {
            return [
                'ok' => true,
                'mode' => 'symlink',
                'message' => "Created symlink public_html/storage → {$target}",
                'path' => $link,
            ];
        }

        // Windows / some hosts need junction-style link via Laravel Filesystem.
        try {
            if (function_exists('symlink') === false || PHP_OS_FAMILY === 'Windows') {
                // no-op; fall through
            }
        } catch (\Throwable) {
            //
        }

        if (! $allowMirror) {
            return [
                'ok' => true,
                'mode' => 'serve',
                'message' => 'Could not create symlink (common on shared hosting). Skipping copy folder. Logos are served by Laravel public.serve at /storage/... — ensure config cache is cleared. Pass &mirror=1 only if you must copy files into public_html/storage.',
                'path' => $link,
            ];
        }

        $mirror = PublicStorageWebMirror::mirrorTo($link);

        return [
            'ok' => true,
            'mode' => 'mirror',
            'message' => "Symlink failed; mirrored {$mirror['copied']} file(s) to public_html/storage (copy mode).",
            'path' => $link,
        ];
    }
}
