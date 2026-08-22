<?php

namespace App\Support;

use Cloudinary\Api\Admin\AdminApi;
use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Configuration\Configuration;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class CloudinaryImageStorage
{
    /**
     * Test doubles for upload / destroy (null = use real Cloudinary SDK).
     *
     * @var (callable(UploadedFile, string): array{secure_url: string, public_id: string})|null
     */
    public static $uploadUsing = null;

    /** @var (callable(string): void)|null */
    public static $destroyUsing = null;

    /** @var (callable(string): bool)|null */
    public static $existsUsing = null;

    /** @var list<string> */
    public static array $fakePublicIds = [];

    public static int $uploadLocalPathCallCount = 0;

    public static function configured(): bool
    {
        if (filled(config('cloudinary.cloud_url'))) {
            return true;
        }

        return filled(config('cloudinary.cloud_name'))
            && filled(config('cloudinary.api_key'))
            && filled(config('cloudinary.api_secret'));
    }

    /**
     * Cloud name for delivery URLs (from CLOUDINARY_CLOUD_NAME or CLOUDINARY_URL host).
     */
    public static function cloudName(): ?string
    {
        if (filled(config('cloudinary.cloud_name'))) {
            return (string) config('cloudinary.cloud_name');
        }

        $cloudUrl = config('cloudinary.cloud_url');

        if (! filled($cloudUrl)) {
            return null;
        }

        $host = parse_url((string) $cloudUrl, PHP_URL_HOST);

        return is_string($host) && $host !== '' ? $host : null;
    }

    /**
     * Default thumbnail URL for missing / broken / empty images.
     *
     * Prefers CLOUDINARY_DEFAULT_IMAGE as a full URL or public_id (built with
     * the cloud name). Falls back to the local public asset when Cloudinary
     * delivery cannot be resolved.
     */
    public static function defaultImageUrl(): string
    {
        $configured = config('cloudinary.default_image');

        if (filled($configured)) {
            if (self::isRemoteUrl((string) $configured)) {
                return (string) $configured;
            }

            $cloudName = self::cloudName();

            if (filled($cloudName)) {
                $publicId = ltrim(str_replace('\\', '/', (string) $configured), '/');

                return 'https://res.cloudinary.com/'.$cloudName.'/image/upload/'.$publicId;
            }
        }

        $local = (string) config('cloudinary.local_default_image', 'default-avatar.png');

        return '/'.ltrim(str_replace('\\', '/', $local), '/');
    }

    public static function store(UploadedFile $file, string $directory): string
    {
        return self::storeWithMeta($file, $directory)['path'];
    }

    /**
     * Store an image and return path + optional Cloudinary public_id.
     *
     * @return array{path: string, public_id: ?string, remote: bool}
     */
    public static function storeWithMeta(UploadedFile $file, string $directory): array
    {
        if (! self::configured()) {
            return [
                'path' => $file->store($directory, 'public'),
                'public_id' => null,
                'remote' => false,
            ];
        }

        $result = self::upload($file, $directory);

        return [
            'path' => $result['secure_url'],
            'public_id' => $result['public_id'],
            'remote' => true,
        ];
    }

    public static function delete(?string $path): void
    {
        if (! filled($path)) {
            return;
        }

        if (self::isRemoteUrl($path)) {
            if (! self::configured()) {
                return;
            }

            $publicId = self::publicIdFromUrl($path);

            if ($publicId === null) {
                return;
            }

            self::destroy($publicId);

            return;
        }

        Storage::disk('public')->delete($path);
    }

    public static function replace(?string $existingPath, UploadedFile $file, string $directory): string
    {
        $path = self::store($file, $directory);
        self::delete($existingPath);

        return $path;
    }

    public static function isRemoteUrl(?string $path): bool
    {
        if (! filled($path)) {
            return false;
        }

        return str_starts_with($path, 'http://') || str_starts_with($path, 'https://');
    }

    /**
     * Extract a Cloudinary public_id from a delivery URL produced by our uploads.
     */
    public static function publicIdFromUrl(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);

        if (! is_string($path) || $path === '') {
            return null;
        }

        if (! preg_match('#/upload/(?:.*?/)?v\d+/(.+)$#', $path, $matches)) {
            if (! preg_match('#/upload/(.+)$#', $path, $matches)) {
                return null;
            }
        }

        $publicId = $matches[1];
        $publicId = preg_replace('#\.[a-zA-Z0-9]+$#', '', $publicId) ?? $publicId;

        return $publicId !== '' ? $publicId : null;
    }

    /**
     * Enable Cloudinary fakes for Pest / unit tests (no real API calls).
     */
    public static function fake(): void
    {
        config([
            'cloudinary.cloud_url' => null,
            'cloudinary.cloud_name' => 'test-cloud',
            'cloudinary.api_key' => 'test-key',
            'cloudinary.api_secret' => 'test-secret',
            'cloudinary.folder' => 'madfan',
            'cloudinary.default_image' => 'madfan/defaults/thumbnail',
        ]);

        self::$uploadUsing = function (UploadedFile $file, string $directory): array {
            $id = trim($directory, '/').'/'.Str::lower(Str::random(16));
            $publicId = 'madfan/'.$id;
            self::$fakePublicIds[] = $publicId;

            return [
                'public_id' => $publicId,
                'secure_url' => 'https://res.cloudinary.com/test-cloud/image/upload/v1/'.$publicId.'.jpg',
            ];
        };

        self::$destroyUsing = static function (string $publicId): void {
            self::$fakePublicIds = array_values(array_filter(
                self::$fakePublicIds,
                static fn (string $id): bool => $id !== $publicId,
            ));
        };

        self::$existsUsing = static function (string $publicId): bool {
            $normalized = ltrim(str_replace('\\', '/', $publicId), '/');

            return in_array($normalized, self::$fakePublicIds, true);
        };
    }

    public static function fakeReset(): void
    {
        self::$uploadUsing = null;
        self::$destroyUsing = null;
        self::$existsUsing = null;
        self::$fakePublicIds = [];
        self::$uploadLocalPathCallCount = 0;
    }

    public static function fakeMarkExists(string $publicId): void
    {
        $normalized = ltrim(str_replace('\\', '/', $publicId), '/');

        if (! in_array($normalized, self::$fakePublicIds, true)) {
            self::$fakePublicIds[] = $normalized;
        }
    }

    /**
     * Whether an image resource already exists at the given public_id.
     */
    public static function publicIdExists(string $publicId): bool
    {
        $publicId = ltrim(str_replace('\\', '/', $publicId), '/');

        if ($publicId === '') {
            return false;
        }

        if (self::$existsUsing !== null) {
            return (self::$existsUsing)($publicId);
        }

        if (! self::configured()) {
            return false;
        }

        try {
            self::adminApi()->asset($publicId, ['resource_type' => 'image']);

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * Absolute Cloudinary delivery URL for a known public_id.
     *
     * @param  list<string>  $transforms  Optional Cloudinary transformation segments (e.g. ['f_auto', 'q_auto']).
     */
    public static function deliveryUrl(string $publicId, array $transforms = []): ?string
    {
        $cloudName = self::cloudName();
        $publicId = ltrim(str_replace('\\', '/', $publicId), '/');

        if ($cloudName === null || $publicId === '') {
            return null;
        }

        $transformPath = $transforms === []
            ? ''
            : implode(',', $transforms).'/';

        return 'https://res.cloudinary.com/'.$cloudName.'/image/upload/'.$transformPath.$publicId;
    }

    /**
     * Upload a local filesystem image to a stable Cloudinary public_id (overwrite).
     *
     * @return array{secure_url: string, public_id: string}
     */
    public static function uploadLocalPath(string $absolutePath, string $publicId, bool $overwrite = true): array
    {
        if (! is_file($absolutePath)) {
            throw new \InvalidArgumentException("Landing media file missing: {$absolutePath}");
        }

        if (! self::configured()) {
            throw new \RuntimeException('Cloudinary is not configured; cannot upload landing media.');
        }

        if (self::$uploadUsing !== null) {
            $cloud = self::cloudName() ?? 'test-cloud';
            $stableId = ltrim(str_replace('\\', '/', $publicId), '/');
            self::fakeMarkExists($stableId);
            self::$uploadLocalPathCallCount++;

            return [
                'public_id' => $stableId,
                'secure_url' => 'https://res.cloudinary.com/'.$cloud.'/image/upload/v1/'.$stableId.'.jpg',
            ];
        }

        $options = [
            'public_id' => ltrim(str_replace('\\', '/', $publicId), '/'),
            'resource_type' => 'image',
            'overwrite' => $overwrite,
            'invalidate' => true,
            'unique_filename' => false,
            'use_filename' => false,
        ];

        $preset = config('cloudinary.upload_preset');

        if (filled($preset)) {
            $options['upload_preset'] = $preset;
        }

        /** @var array{secure_url?: string, public_id?: string} $result */
        $result = self::uploadApi()->upload($absolutePath, $options);

        $secureUrl = $result['secure_url'] ?? null;
        $resultPublicId = $result['public_id'] ?? null;

        if (! filled($secureUrl) || ! filled($resultPublicId)) {
            throw new \RuntimeException('Cloudinary upload did not return a secure URL and public_id.');
        }

        return [
            'secure_url' => $secureUrl,
            'public_id' => $resultPublicId,
        ];
    }

    /**
     * @return array{secure_url: string, public_id: string}
     */
    private static function upload(UploadedFile $file, string $directory): array
    {
        if (self::$uploadUsing !== null) {
            return (self::$uploadUsing)($file, $directory);
        }

        $folder = self::folderFor($directory);
        $options = [
            'folder' => $folder,
            'resource_type' => 'image',
            'overwrite' => false,
            'unique_filename' => true,
        ];

        $preset = config('cloudinary.upload_preset');

        if (filled($preset)) {
            $options['upload_preset'] = $preset;
        }

        /** @var array{secure_url?: string, public_id?: string} $result */
        $result = self::uploadApi()->upload($file->getRealPath(), $options);

        $secureUrl = $result['secure_url'] ?? null;
        $publicId = $result['public_id'] ?? null;

        if (! filled($secureUrl) || ! filled($publicId)) {
            throw new \RuntimeException('Cloudinary upload did not return a secure URL and public_id.');
        }

        return [
            'secure_url' => $secureUrl,
            'public_id' => $publicId,
        ];
    }

    private static function destroy(string $publicId): void
    {
        if (self::$destroyUsing !== null) {
            (self::$destroyUsing)($publicId);

            return;
        }

        try {
            self::uploadApi()->destroy($publicId);
        } catch (Throwable) {
            // Best-effort cleanup; do not block replace/delete flows.
        }
    }

    private static function folderFor(string $directory): string
    {
        $prefix = trim((string) config('cloudinary.folder', 'madfan'), '/');
        $directory = trim(str_replace('\\', '/', $directory), '/');

        return $prefix === '' ? $directory : $prefix.'/'.$directory;
    }

    private static function uploadApi(): UploadApi
    {
        return new UploadApi(self::configuration());
    }

    private static function adminApi(): AdminApi
    {
        return new AdminApi(self::configuration());
    }

    private static function configuration(): Configuration
    {
        $cloudUrl = config('cloudinary.cloud_url');

        if (filled($cloudUrl)) {
            return Configuration::fromCloudinaryUrl((string) $cloudUrl);
        }

        return Configuration::fromParams([
            'cloud' => [
                'cloud_name' => config('cloudinary.cloud_name'),
                'api_key' => config('cloudinary.api_key'),
                'api_secret' => config('cloudinary.api_secret'),
            ],
            'url' => [
                'secure' => true,
            ],
        ]);
    }
}
