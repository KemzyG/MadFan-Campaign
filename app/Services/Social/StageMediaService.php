<?php

namespace App\Services\Social;

use App\Enums\MediaAssetSource;
use App\Models\MediaAsset;
use App\Models\Stage;
use App\Support\CloudinaryImageStorage;
use Illuminate\Support\Facades\File;
use RuntimeException;

class StageMediaService
{
    public const BACKGROUND_COUNT = 4;

    /**
     * @return list<int>
     */
    public function backgroundKeys(): array
    {
        return range(1, self::BACKGROUND_COUNT);
    }

    public function normalizeBackgroundKey(?int $key): int
    {
        if ($key === null || $key < 1 || $key > self::BACKGROUND_COUNT) {
            return 1;
        }

        return $key;
    }

    public function defaultBackgroundKey(): int
    {
        return random_int(1, self::BACKGROUND_COUNT);
    }

    /**
     * Absolute path to the committed source PNG for a background key.
     */
    public function sourcePath(int $key): string
    {
        $file = (string) config("stage.backgrounds.{$key}.file");

        return resource_path('images/stage/'.$file);
    }

    public function urlForKey(int $key): ?string
    {
        $key = $this->normalizeBackgroundKey($key);
        $meta = config("stage.backgrounds.{$key}");

        if (! is_array($meta)) {
            return null;
        }

        $publicId = (string) ($meta['public_id'] ?? '');
        $filename = (string) ($meta['file'] ?? '');
        $localPublicRelative = 'stage-media/'.$filename;
        $localPublicAbsolute = public_path($localPublicRelative);

        if (filled($publicId)) {
            $storedPath = MediaAsset::query()
                ->where('cloudinary_public_id', $publicId)
                ->value('path');

            if (filled($storedPath) && CloudinaryImageStorage::isRemoteUrl((string) $storedPath)) {
                return (string) $storedPath;
            }

            if (filled($storedPath) && ! CloudinaryImageStorage::isRemoteUrl((string) $storedPath) && is_file(public_path((string) $storedPath))) {
                return '/'.ltrim(str_replace('\\', '/', (string) $storedPath), '/');
            }

            if (CloudinaryImageStorage::configured()) {
                $deliveryUrl = CloudinaryImageStorage::deliveryUrl($publicId);

                if (filled($deliveryUrl)) {
                    return $deliveryUrl;
                }
            }
        }

        if ($filename !== '' && is_file($localPublicAbsolute)) {
            return '/'.ltrim(str_replace('\\', '/', $localPublicRelative), '/');
        }

        return null;
    }

    public function urlForStage(?Stage $stage): string
    {
        $key = $this->normalizeBackgroundKey($stage?->background_key);

        return $this->urlForKey($key) ?? '/stage-media/stage-bg-'.$key.'.png';
    }

    /**
     * @return list<array{key: int, url: string, label: string, alt: string}>
     */
    public function presentBackgroundOptions(): array
    {
        $options = [];

        foreach ($this->backgroundKeys() as $key) {
            $meta = config("stage.backgrounds.{$key}", []);
            $url = $this->urlForKey($key) ?? '/stage-media/stage-bg-'.$key.'.png';

            $options[] = [
                'key' => $key,
                'url' => $url,
                'label' => (string) ($meta['label'] ?? 'Background '.$key),
                'alt' => (string) ($meta['alt'] ?? 'Stage background'),
            ];
        }

        return $options;
    }

    /**
     * Push every stage PNG to Cloudinary (stable public_ids) or public/stage-media.
     *
     * @return list<array{key: string, storage: string, url: string, public_id: ?string, action: string}>
     */
    public function sync(bool $overwrite = false): array
    {
        $results = [];

        foreach ($this->backgroundKeys() as $key) {
            $results[] = $this->syncOne($key, $overwrite);
        }

        return $results;
    }

    /**
     * @return array{key: string, storage: string, url: string, public_id: ?string, action: string}
     */
    public function syncOne(int $key, bool $overwrite = false): array
    {
        $meta = config("stage.backgrounds.{$key}");

        if (! is_array($meta)) {
            throw new RuntimeException("Unknown stage background [{$key}].");
        }

        $source = $this->sourcePath($key);

        if (! is_file($source)) {
            throw new RuntimeException("Missing stage source image: {$source}");
        }

        $publicId = (string) $meta['public_id'];
        $title = 'Stage · background '.$key;
        $sourceBytes = filesize($source) ?: null;
        $existing = MediaAsset::query()->where('cloudinary_public_id', $publicId)->first();
        $stringKey = (string) $key;

        if (CloudinaryImageStorage::configured()) {
            $existsRemotely = CloudinaryImageStorage::publicIdExists($publicId);
            $hasRemoteDelivery = $existing !== null && CloudinaryImageStorage::isRemoteUrl($existing->path);
            $sourceUnchanged = $existing !== null
                && $sourceBytes !== null
                && (int) $existing->bytes === (int) $sourceBytes;

            $shouldSkip = ! $overwrite && (
                ($sourceUnchanged && ($hasRemoteDelivery || $existsRemotely))
                || ($existsRemotely && $existing === null)
            );

            if ($shouldSkip) {
                $url = $this->resolveCloudinaryUrl($publicId, $existing);

                $asset = MediaAsset::query()->updateOrCreate(
                    ['cloudinary_public_id' => $publicId],
                    [
                        'title' => $title,
                        'alt_text' => (string) ($meta['alt'] ?? ''),
                        'path' => $url,
                        'source' => MediaAssetSource::Generated,
                        'prompt' => 'Mad Fan stage background · '.$key,
                        'mime_type' => 'image/png',
                        'bytes' => $sourceBytes,
                    ],
                );

                return [
                    'key' => $stringKey,
                    'storage' => 'cloudinary',
                    'url' => $asset->path,
                    'public_id' => $publicId,
                    'action' => 'skipped',
                ];
            }

            $uploaded = CloudinaryImageStorage::uploadLocalPath($source, $publicId, $overwrite);

            $asset = MediaAsset::query()->updateOrCreate(
                ['cloudinary_public_id' => $uploaded['public_id']],
                [
                    'title' => $title,
                    'alt_text' => (string) ($meta['alt'] ?? ''),
                    'path' => $uploaded['secure_url'],
                    'source' => MediaAssetSource::Generated,
                    'prompt' => 'Mad Fan stage background · '.$key,
                    'mime_type' => 'image/png',
                    'bytes' => $sourceBytes,
                ],
            );

            return [
                'key' => $stringKey,
                'storage' => 'cloudinary',
                'url' => $asset->path,
                'public_id' => $uploaded['public_id'],
                'action' => $existsRemotely || $existing !== null ? 'updated' : 'uploaded',
            ];
        }

        $destDir = public_path('stage-media');
        File::ensureDirectoryExists($destDir);
        $filename = (string) $meta['file'];
        $destination = $destDir.DIRECTORY_SEPARATOR.$filename;
        $localExists = is_file($destination);
        $localUnchanged = $localExists
            && $sourceBytes !== null
            && filesize($destination) === $sourceBytes
            && $existing !== null;

        if (! $overwrite && $localUnchanged) {
            return [
                'key' => $stringKey,
                'storage' => 'local',
                'url' => '/stage-media/'.$filename,
                'public_id' => null,
                'action' => 'skipped',
            ];
        }

        File::copy($source, $destination);

        MediaAsset::query()->updateOrCreate(
            ['cloudinary_public_id' => $publicId],
            [
                'title' => $title,
                'alt_text' => (string) ($meta['alt'] ?? ''),
                'path' => 'stage-media/'.$filename,
                'source' => MediaAssetSource::Upload,
                'prompt' => 'Mad Fan stage background · '.$key.' (local publish; configure Cloudinary for CDN)',
                'mime_type' => 'image/png',
                'bytes' => $sourceBytes,
            ],
        );

        return [
            'key' => $stringKey,
            'storage' => 'local',
            'url' => '/stage-media/'.$filename,
            'public_id' => null,
            'action' => $localExists ? 'updated' : 'uploaded',
        ];
    }

    private function resolveCloudinaryUrl(string $publicId, ?MediaAsset $existing): string
    {
        if ($existing !== null && CloudinaryImageStorage::isRemoteUrl($existing->path)) {
            return (string) $existing->path;
        }

        $deliveryUrl = CloudinaryImageStorage::deliveryUrl($publicId);

        if (filled($deliveryUrl)) {
            return $deliveryUrl;
        }

        throw new RuntimeException("Unable to resolve Cloudinary URL for [{$publicId}].");
    }
}
