<?php

namespace App\Services\Fan;

use App\Enums\MediaAssetSource;
use App\Models\MediaAsset;
use App\Support\CloudinaryImageStorage;
use Illuminate\Support\Facades\File;
use RuntimeException;

class LandingMediaService
{
    /**
     * Absolute path to the committed source PNG for a landing asset key.
     */
    public function sourcePath(string $key): string
    {
        $file = (string) config("landing.assets.{$key}.file");

        return resource_path('images/landing/'.$file);
    }

    /**
     * Resolve delivery URLs for the marketing landing page.
     *
     * Prefers Cloudinary delivery for stable public_ids (survive deploys).
     * Falls back to locally published copies under /landing-media when
     * Cloudinary is not configured.
     *
     * @return array{
     *     hero: array{url: string, alt: string}|null,
     *     categories: array<string, array{url: string, alt: string}>,
     *     kits: list<array{id: string, name: string, image_url: string, slug: null}>
     * }
     */
    public function present(): array
    {
        $assets = config('landing.assets', []);
        $categories = [];
        $kits = [];
        $hero = null;

        foreach ($assets as $key => $meta) {
            $url = $this->urlForKey((string) $key);

            if ($url === null) {
                continue;
            }

            $payload = [
                'url' => $url,
                'alt' => (string) ($meta['alt'] ?? 'Mad Fan'),
            ];

            $role = (string) ($meta['role'] ?? '');

            if ($role === 'hero') {
                $hero = $payload;
            } elseif ($role === 'category') {
                $categories[(string) $key] = $payload;
            } elseif ($role === 'kit') {
                $kits[] = [
                    'id' => (string) $key,
                    'name' => (string) ($meta['label'] ?? $key),
                    'image_url' => $url,
                    'slug' => null,
                ];
            }
        }

        return [
            'hero' => $hero,
            'categories' => $categories,
            'kits' => $kits,
        ];
    }

    public function urlForKey(string $key): ?string
    {
        $meta = config("landing.assets.{$key}");

        if (! is_array($meta)) {
            return null;
        }

        $publicId = (string) ($meta['public_id'] ?? '');
        $filename = (string) ($meta['file'] ?? '');
        $localPublicRelative = 'landing-media/'.$filename;
        $localPublicAbsolute = public_path($localPublicRelative);

        if (filled($publicId)) {
            $storedPath = MediaAsset::query()
                ->where('cloudinary_public_id', $publicId)
                ->value('path');

            if (filled($storedPath) && CloudinaryImageStorage::isRemoteUrl((string) $storedPath)) {
                return (string) $storedPath;
            }

            if (filled($storedPath) && ! CloudinaryImageStorage::isRemoteUrl((string) $storedPath) && is_file(public_path((string) $storedPath))) {
                return asset((string) $storedPath);
            }
        }

        if ($filename !== '' && is_file($localPublicAbsolute)) {
            return asset($localPublicRelative);
        }

        return null;
    }

    /**
     * Push every landing PNG to Cloudinary (stable public_ids) or public/landing-media.
     *
     * @return list<array{key: string, storage: string, url: string, public_id: ?string}>
     */
    public function sync(bool $overwrite = true): array
    {
        $results = [];

        foreach (array_keys(config('landing.assets', [])) as $key) {
            $results[] = $this->syncOne((string) $key, $overwrite);
        }

        return $results;
    }

    /**
     * @return array{key: string, storage: string, url: string, public_id: ?string}
     */
    public function syncOne(string $key, bool $overwrite = true): array
    {
        $meta = config("landing.assets.{$key}");

        if (! is_array($meta)) {
            throw new RuntimeException("Unknown landing asset [{$key}].");
        }

        $source = $this->sourcePath($key);

        if (! is_file($source)) {
            throw new RuntimeException("Missing landing source image: {$source}");
        }

        $publicId = (string) $meta['public_id'];
        $title = 'Landing · '.$key;

        if (CloudinaryImageStorage::configured()) {
            $uploaded = CloudinaryImageStorage::uploadLocalPath($source, $publicId, $overwrite);

            $asset = MediaAsset::query()->updateOrCreate(
                ['cloudinary_public_id' => $uploaded['public_id']],
                [
                    'title' => $title,
                    'alt_text' => (string) ($meta['alt'] ?? ''),
                    'path' => $uploaded['secure_url'],
                    'source' => MediaAssetSource::Generated,
                    'prompt' => 'Mad Fan landing media · '.$key,
                    'mime_type' => 'image/png',
                    'bytes' => filesize($source) ?: null,
                ],
            );

            return [
                'key' => $key,
                'storage' => 'cloudinary',
                'url' => $asset->path,
                'public_id' => $uploaded['public_id'],
            ];
        }

        $destDir = public_path('landing-media');
        File::ensureDirectoryExists($destDir);
        $filename = (string) $meta['file'];
        File::copy($source, $destDir.DIRECTORY_SEPARATOR.$filename);

        $localUrl = asset('landing-media/'.$filename);

        MediaAsset::query()->updateOrCreate(
            ['cloudinary_public_id' => $publicId],
            [
                'title' => $title,
                'alt_text' => (string) ($meta['alt'] ?? ''),
                'path' => 'landing-media/'.$filename,
                'source' => MediaAssetSource::Upload,
                'prompt' => 'Mad Fan landing media · '.$key.' (local publish; configure Cloudinary for CDN)',
                'mime_type' => 'image/png',
                'bytes' => filesize($source) ?: null,
            ],
        );

        return [
            'key' => $key,
            'storage' => 'local',
            'url' => $localUrl,
            'public_id' => null,
        ];
    }
}
