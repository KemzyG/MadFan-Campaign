<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MediaAssetSource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateMediaAssetRequest;
use App\Http\Requests\Admin\StoreMediaAssetRequest;
use App\Http\Requests\Admin\UpdateMediaAssetRequest;
use App\Models\ActivityLog;
use App\Models\MediaAsset;
use App\Support\CloudinaryImageGeneration;
use App\Support\CloudinaryImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use RuntimeException;
use Throwable;

class MediaAssetsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', MediaAsset::class);

        $assets = MediaAsset::query()
            ->when($request->filled('source'), fn ($query) => $query->where('source', $request->string('source')))
            ->when($request->filled('q'), function ($query) use ($request): void {
                $term = '%'.$request->string('q').'%';
                $query->where(function ($inner) use ($term): void {
                    $inner->where('title', 'like', $term)
                        ->orWhere('alt_text', 'like', $term)
                        ->orWhere('prompt', 'like', $term);
                });
            })
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 24))
            ->through(fn (MediaAsset $asset): array => $asset->toAdminArray());

        return response()->json($assets);
    }

    public function show(MediaAsset $mediaAsset): JsonResponse
    {
        Gate::authorize('view', $mediaAsset);

        return response()->json($mediaAsset->toAdminArray());
    }

    public function store(StoreMediaAssetRequest $request): JsonResponse
    {
        Gate::authorize('create', MediaAsset::class);

        $file = $request->file('image');
        $stored = CloudinaryImageStorage::storeWithMeta($file, 'media');

        $asset = MediaAsset::query()->create([
            'title' => $request->validated('title') ?: $file->getClientOriginalName(),
            'alt_text' => $request->validated('alt_text'),
            'path' => $stored['path'],
            'cloudinary_public_id' => $stored['public_id'],
            'source' => MediaAssetSource::Upload,
            'mime_type' => $file->getMimeType(),
            'bytes' => $file->getSize() ?: null,
            'uploaded_by' => $request->user()?->id,
        ]);

        ActivityLog::record('media.uploaded', "Uploaded media asset #{$asset->id}");

        return response()->json([
            'asset' => $asset->toAdminArray(),
            'storage' => $stored['remote'] ? 'cloudinary' : 'local',
            'message' => $stored['remote']
                ? 'Image uploaded to Cloudinary.'
                : 'Cloudinary is not configured; image stored on the local public disk.',
        ], 201);
    }

    public function generate(GenerateMediaAssetRequest $request): JsonResponse
    {
        Gate::authorize('create', MediaAsset::class);

        if (! CloudinaryImageGeneration::available() && CloudinaryImageGeneration::$generateUsing === null) {
            return response()->json([
                'message' => 'Cloudinary Image Generation is not configured. Set CLOUDINARY_URL (or cloud name + API key/secret) and enable the Image Generation add-on. Device uploads still work with a local disk fallback.',
            ], 422);
        }

        try {
            $result = CloudinaryImageGeneration::textToImage(
                $request->validated('prompt'),
                ['folder' => trim((string) config('cloudinary.folder', 'madfan'), '/').'/media'],
            );
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Image generation failed unexpectedly. Please try again.',
            ], 422);
        }

        $asset = MediaAsset::query()->create([
            'title' => $request->validated('title') ?: 'Generated image',
            'alt_text' => $request->validated('alt_text'),
            'path' => $result['secure_url'],
            'cloudinary_public_id' => $result['public_id'],
            'source' => MediaAssetSource::Generated,
            'prompt' => $request->validated('prompt'),
            'mime_type' => 'image/jpeg',
            'uploaded_by' => $request->user()?->id,
        ]);

        ActivityLog::record('media.generated', "Generated media asset #{$asset->id}");

        return response()->json([
            'asset' => $asset->toAdminArray(),
            'storage' => 'cloudinary',
            'message' => 'Image generated and saved to the gallery.',
        ], 201);
    }

    public function update(UpdateMediaAssetRequest $request, MediaAsset $mediaAsset): JsonResponse
    {
        Gate::authorize('update', $mediaAsset);

        $data = $request->safe()->only(['title', 'alt_text']);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $stored = CloudinaryImageStorage::storeWithMeta($file, 'media');
            CloudinaryImageStorage::delete($mediaAsset->path);

            $data['path'] = $stored['path'];
            $data['cloudinary_public_id'] = $stored['public_id'];
            $data['mime_type'] = $file->getMimeType();
            $data['bytes'] = $file->getSize() ?: null;
            $data['source'] = MediaAssetSource::Upload;
            $data['prompt'] = null;
        }

        $mediaAsset->update($data);

        ActivityLog::record('media.updated', "Updated media asset #{$mediaAsset->id}");

        return response()->json([
            'asset' => $mediaAsset->fresh()->toAdminArray(),
            'message' => 'Media asset updated.',
        ]);
    }

    public function destroy(MediaAsset $mediaAsset): JsonResponse
    {
        Gate::authorize('delete', $mediaAsset);

        CloudinaryImageStorage::delete($mediaAsset->path);
        ActivityLog::record('media.deleted', "Deleted media asset #{$mediaAsset->id}");
        $mediaAsset->delete();

        return response()->json(['message' => 'Media asset deleted.']);
    }
}
