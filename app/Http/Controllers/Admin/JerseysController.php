<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreJerseyRequest;
use App\Http\Requests\Admin\UpdateJerseyRequest;
use App\Models\ActivityLog;
use App\Models\Jersey;
use App\Models\JerseyVariant;
use App\Support\BrandLogoStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class JerseysController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageJerseys');

        $jerseys = Jersey::query()
            ->with(['club:id,name,short', 'variants', 'mediaAssets'])
            ->when($request->filled('club_id'), fn ($query) => $query->where('club_id', $request->integer('club_id')))
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20));

        return response()->json($jerseys);
    }

    public function show(Jersey $jersey): JsonResponse
    {
        Gate::authorize('manageJerseys');

        return response()->json($jersey->load(['club:id,name,short', 'variants', 'mediaAssets']));
    }

    public function store(StoreJerseyRequest $request): JsonResponse
    {
        Gate::authorize('manageJerseys');

        $jersey = DB::transaction(function () use ($request): Jersey {
            $data = $request->safe()->only(['club_id', 'name', 'slug', 'description', 'price', 'is_active']);
            $data['is_active'] = $request->boolean('is_active', true);

            if (blank($data['slug'] ?? null)) {
                unset($data['slug']);
            }

            if ($request->hasFile('image')) {
                $data['image'] = BrandLogoStorage::store($request->file('image'), 'jerseys');
            }

            $jersey = Jersey::query()->create($data);

            foreach ($request->validated('variants') as $variant) {
                $jersey->variants()->create([
                    'size' => $variant['size'],
                    'stock' => $variant['stock'],
                    'sku' => $variant['sku'] ?? null,
                ]);
            }

            $this->syncMediaAssets($jersey, $request->validated('media_asset_ids') ?? []);

            return $jersey;
        });

        ActivityLog::record('jersey.created', "Created jersey {$jersey->name}");

        return response()->json($jersey->load(['club:id,name,short', 'variants', 'mediaAssets']), 201);
    }

    public function update(UpdateJerseyRequest $request, Jersey $jersey): JsonResponse
    {
        Gate::authorize('manageJerseys');

        DB::transaction(function () use ($request, $jersey): void {
            $data = $request->safe()->only(['club_id', 'name', 'slug', 'description', 'price', 'is_active']);

            if ($request->has('is_active')) {
                $data['is_active'] = $request->boolean('is_active');
            }

            if (blank($data['slug'] ?? null)) {
                unset($data['slug']);
            }

            if ($request->boolean('remove_image') && ! $request->hasFile('image')) {
                BrandLogoStorage::delete($jersey->image);
                $data['image'] = null;
            }

            if ($request->hasFile('image')) {
                $data['image'] = BrandLogoStorage::replace($jersey->image, $request->file('image'), 'jerseys');
            }

            $jersey->update($data);

            $keptIds = [];

            foreach ($request->validated('variants') as $variantData) {
                $variant = null;

                if (! empty($variantData['id'])) {
                    $variant = JerseyVariant::query()
                        ->where('jersey_id', $jersey->id)
                        ->whereKey($variantData['id'])
                        ->first();
                }

                if ($variant === null) {
                    $variant = $jersey->variants()->create([
                        'size' => $variantData['size'],
                        'stock' => $variantData['stock'],
                        'sku' => $variantData['sku'] ?? null,
                    ]);
                } else {
                    $variant->update([
                        'size' => $variantData['size'],
                        'stock' => $variantData['stock'],
                        'sku' => $variantData['sku'] ?? null,
                    ]);
                }

                $keptIds[] = $variant->id;
            }

            $jersey->variants()->whereNotIn('id', $keptIds)->delete();

            if ($request->boolean('sync_gallery') || $request->exists('media_asset_ids')) {
                $this->syncMediaAssets($jersey, $request->input('media_asset_ids', []));
            }
        });

        ActivityLog::record('jersey.updated', "Updated jersey {$jersey->name}");

        return response()->json($jersey->fresh()->load(['club:id,name,short', 'variants', 'mediaAssets']));
    }

    public function destroy(Jersey $jersey): JsonResponse
    {
        Gate::authorize('manageJerseys');

        BrandLogoStorage::delete($jersey->image);
        ActivityLog::record('jersey.deleted', "Deleted jersey {$jersey->name}");
        $jersey->delete();

        return response()->json(['message' => 'Jersey deleted.']);
    }

    /**
     * @param  list<int|string>  $mediaAssetIds
     */
    private function syncMediaAssets(Jersey $jersey, array $mediaAssetIds): void
    {
        $sync = [];

        foreach (array_values($mediaAssetIds) as $index => $mediaAssetId) {
            $sync[(int) $mediaAssetId] = ['sort_order' => $index];
        }

        $jersey->mediaAssets()->sync($sync);
    }
}
