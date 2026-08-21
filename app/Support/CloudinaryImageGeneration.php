<?php

namespace App\Support;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Cloudinary Image Generation (text-to-image) client.
 *
 * Uses the v2 generate API when credentials are present. Tests can inject
 * a fake via {@see fake()}. When Cloudinary is not configured, callers
 * should surface a clear validation/error message instead of falling back.
 */
class CloudinaryImageGeneration
{
    /**
     * @var (callable(string, array<string, mixed>): array{secure_url: string, public_id: string})|null
     */
    public static $generateUsing = null;

    public static function available(): bool
    {
        return CloudinaryImageStorage::configured()
            && filled(CloudinaryImageStorage::cloudName());
    }

    /**
     * @param  array{folder?: string, model?: string}  $options
     * @return array{secure_url: string, public_id: string}
     */
    public static function textToImage(string $prompt, array $options = []): array
    {
        $prompt = trim($prompt);

        if ($prompt === '') {
            throw new RuntimeException('A prompt is required to generate an image.');
        }

        if (self::$generateUsing !== null) {
            return (self::$generateUsing)($prompt, $options);
        }

        if (! self::available()) {
            throw new RuntimeException(
                'Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET, and enable the Image Generation add-on.',
            );
        }

        $cloudName = CloudinaryImageStorage::cloudName();
        $apiKey = config('cloudinary.api_key');
        $apiSecret = config('cloudinary.api_secret');

        if ((! filled($apiKey) || ! filled($apiSecret)) && filled(config('cloudinary.cloud_url'))) {
            [$apiKey, $apiSecret] = self::credentialsFromCloudUrl((string) config('cloudinary.cloud_url'));
        }

        if (! filled($apiKey) || ! filled($apiSecret)) {
            throw new RuntimeException(
                'Cloudinary API credentials are incomplete. Image generation requires API key and secret.',
            );
        }

        $folder = trim((string) ($options['folder'] ?? config('cloudinary.folder', 'madfan').'/media'), '/');
        $payload = [
            'prompt' => $prompt,
            'target' => [
                'target_type' => 'managed_asset',
                'folder' => $folder,
            ],
        ];

        if (filled($options['model'] ?? null)) {
            $payload['model'] = $options['model'];
        } elseif (filled(config('cloudinary.generation_model'))) {
            $payload['model'] = config('cloudinary.generation_model');
        }

        try {
            $response = Http::withBasicAuth((string) $apiKey, (string) $apiSecret)
                ->acceptJson()
                ->asJson()
                ->timeout((int) config('cloudinary.generation_timeout', 90))
                ->post(
                    'https://api.cloudinary.com/v2/generate/'.$cloudName.'/text_to_image',
                    $payload,
                );
        } catch (ConnectionException $exception) {
            throw new RuntimeException(
                'Could not reach Cloudinary Image Generation. Check network connectivity and try again.',
                previous: $exception,
            );
        } catch (Throwable $exception) {
            throw new RuntimeException(
                'Cloudinary Image Generation request failed: '.$exception->getMessage(),
                previous: $exception,
            );
        }

        if ($response->status() === 401 || $response->status() === 403) {
            throw new RuntimeException(
                'Cloudinary rejected the generation request. Verify API credentials and that the Image Generation add-on is enabled.',
            );
        }

        if ($response->status() === 402 || $response->status() === 429) {
            throw new RuntimeException(
                'Cloudinary Image Generation quota or rate limit reached. Try again later or upgrade the add-on.',
            );
        }

        if (! $response->successful()) {
            $message = $response->json('error.message')
                ?? $response->json('message')
                ?? 'Cloudinary Image Generation failed (HTTP '.$response->status().').';

            throw new RuntimeException(is_string($message) ? $message : 'Cloudinary Image Generation failed.');
        }

        $secureUrl = $response->json('data.secure_url')
            ?? $response->json('secure_url');
        $publicId = $response->json('data.public_id')
            ?? $response->json('public_id');

        if (! filled($secureUrl) || ! filled($publicId)) {
            // Some responses nest under asset / result keys.
            $secureUrl = $secureUrl
                ?? $response->json('data.asset.secure_url')
                ?? $response->json('asset.secure_url');
            $publicId = $publicId
                ?? $response->json('data.asset.public_id')
                ?? $response->json('asset.public_id');
        }

        if (! filled($secureUrl) || ! filled($publicId)) {
            throw new RuntimeException('Cloudinary Image Generation did not return a secure URL and public_id.');
        }

        return [
            'secure_url' => (string) $secureUrl,
            'public_id' => (string) $publicId,
        ];
    }

    public static function fake(): void
    {
        CloudinaryImageStorage::fake();

        self::$generateUsing = function (string $prompt, array $options = []): array {
            $folder = trim((string) ($options['folder'] ?? 'madfan/media'), '/');
            $id = $folder.'/gen-'.Str::lower(Str::random(12));

            return [
                'public_id' => $id,
                'secure_url' => 'https://res.cloudinary.com/test-cloud/image/upload/v1/'.$id.'.jpg',
            ];
        };
    }

    public static function fakeReset(): void
    {
        self::$generateUsing = null;
    }

    /**
     * @return array{0: ?string, 1: ?string}
     */
    private static function credentialsFromCloudUrl(string $cloudUrl): array
    {
        $user = parse_url($cloudUrl, PHP_URL_USER);
        $pass = parse_url($cloudUrl, PHP_URL_PASS);

        return [
            is_string($user) ? $user : null,
            is_string($pass) ? $pass : null,
        ];
    }

    /**
     * Build an UploadedFile-compatible meta payload after generation (no local file).
     *
     * @param  array{secure_url: string, public_id: string}  $result
     * @return array{secure_url: string, public_id: string}
     */
    public static function assertResult(array $result): array
    {
        if (! filled($result['secure_url'] ?? null) || ! filled($result['public_id'] ?? null)) {
            throw new RuntimeException('Invalid Cloudinary generation result.');
        }

        return [
            'secure_url' => (string) $result['secure_url'],
            'public_id' => (string) $result['public_id'],
        ];
    }
}
