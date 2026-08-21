<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Support\CloudinaryImageGeneration;
use App\Support\CloudinaryImageStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MediaGalleryPageController extends Controller
{
    public function index(Request $request): Response
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
            ->withQueryString()
            ->through(fn (MediaAsset $asset): array => $asset->toAdminArray());

        return Inertia::render('Admin/Media/Index', [
            'assets' => $assets,
            'filters' => [
                'q' => $request->string('q')->toString() ?: null,
                'source' => $request->string('source')->toString() ?: null,
            ],
            'cloudinary' => [
                'configured' => CloudinaryImageStorage::configured(),
                'generation_available' => CloudinaryImageGeneration::available(),
            ],
        ]);
    }
}
