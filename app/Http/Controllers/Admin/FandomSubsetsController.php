<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFandomSubsetRequest;
use App\Http\Requests\Admin\UpdateFandomSubsetRequest;
use App\Models\ActivityLog;
use App\Models\Fandom;
use App\Models\FandomSubset;
use App\Support\BrandLogoStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class FandomSubsetsController extends Controller
{
    public function store(StoreFandomSubsetRequest $request, Fandom $fandom): JsonResponse
    {
        Gate::authorize('manageFandoms');

        $data = $request->safe()->only(['name', 'fan_count', 'is_trending', 'sort_order']);
        $data['fandom_id'] = $fandom->id;
        $data['slug'] = $this->resolveSlug($request->input('slug'), $request->string('name'), $fandom->id);
        $data['is_trending'] = $request->boolean('is_trending', false);
        $data['sort_order'] = $request->integer('sort_order', $fandom->subsets()->count());

        if ($request->hasFile('image')) {
            $data['image'] = BrandLogoStorage::store($request->file('image'), 'fandom-subsets');
        }

        $subset = FandomSubset::query()->create($data);

        ActivityLog::record('fandom_subset.created', "Created subset {$subset->name} for {$fandom->name}");

        return response()->json($subset, 201);
    }

    public function update(UpdateFandomSubsetRequest $request, Fandom $fandom, FandomSubset $subset): JsonResponse
    {
        Gate::authorize('manageFandoms');
        abort_unless($subset->fandom_id === $fandom->id, 404);

        $data = $request->safe()->only(['name', 'slug', 'fan_count', 'is_trending', 'sort_order']);

        if ($request->boolean('remove_image') && ! $request->hasFile('image')) {
            BrandLogoStorage::delete($subset->image);
            $data['image'] = null;
        }

        if ($request->hasFile('image')) {
            $data['image'] = BrandLogoStorage::replace($subset->image, $request->file('image'), 'fandom-subsets');
        }

        $subset->update($data);

        ActivityLog::record('fandom_subset.updated', "Updated subset {$subset->name} for {$fandom->name}");

        return response()->json($subset->fresh());
    }

    public function destroy(Fandom $fandom, FandomSubset $subset): JsonResponse
    {
        Gate::authorize('manageFandoms');
        abort_unless($subset->fandom_id === $fandom->id, 404);

        ActivityLog::record('fandom_subset.deleted', "Deleted subset {$subset->name} from {$fandom->name}");
        BrandLogoStorage::delete($subset->image);
        $subset->delete();

        return response()->json(['message' => 'Subset deleted.']);
    }

    private function resolveSlug(?string $slug, string $name, int $fandomId, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug ?: $name);
        $candidate = $base;
        $suffix = 1;

        while (
            FandomSubset::query()
                ->where('fandom_id', $fandomId)
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->exists()
        ) {
            $candidate = $base.'-'.$suffix;
            $suffix++;
        }

        return $candidate;
    }
}
