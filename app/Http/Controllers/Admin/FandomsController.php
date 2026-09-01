<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFandomRequest;
use App\Http\Requests\Admin\UpdateFandomRequest;
use App\Models\ActivityLog;
use App\Models\Fandom;
use App\Support\BrandLogoStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class FandomsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageFandoms');

        $fandoms = Fandom::query()
            ->withCount(['leagues', 'subsets', 'follows', 'polls'])
            ->when($request->filled('group'), fn ($query) => $query->where('group', $request->string('group')))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $term = '%'.$request->string('search').'%';
                $query->where(function ($inner) use ($term): void {
                    $inner->where('name', 'like', $term)->orWhere('slug', 'like', $term);
                });
            })
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return response()->json($fandoms);
    }

    public function show(Fandom $fandom): JsonResponse
    {
        Gate::authorize('manageFandoms');

        return response()->json(
            $fandom->loadCount(['leagues', 'subsets', 'follows', 'polls', 'products', 'predictions'])
                ->load([
                    'subsets' => fn ($query) => $query->orderBy('sort_order'),
                    'leagues' => fn ($query) => $query->withCount('clubs')->orderBy('name'),
                ]),
        );
    }

    public function store(StoreFandomRequest $request): JsonResponse
    {
        Gate::authorize('manageFandoms');

        $data = $request->safe()->only(['name', 'description', 'is_active', 'group', 'icon']);
        $data['slug'] = $this->resolveSlug($request->input('slug'), $request->string('name'));
        $data['is_active'] = $request->boolean('is_active', true);

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = BrandLogoStorage::store($request->file('cover_image'), 'fandoms');
        }

        $fandom = Fandom::query()->create($data);

        ActivityLog::record('fandom.created', "Created fandom {$fandom->name}");

        return response()->json(
            $fandom->loadCount(['leagues', 'subsets', 'follows', 'polls']),
            201,
        );
    }

    public function update(UpdateFandomRequest $request, Fandom $fandom): JsonResponse
    {
        Gate::authorize('manageFandoms');

        $data = $request->safe()->only(['name', 'slug', 'description', 'is_active', 'group', 'icon']);

        if ($request->has('name') && ! $request->filled('slug')) {
            $data['slug'] = $this->resolveSlug(null, $request->string('name'), $fandom->id);
        }

        if ($request->boolean('remove_cover_image') && ! $request->hasFile('cover_image')) {
            BrandLogoStorage::delete($fandom->cover_image);
            $data['cover_image'] = null;
        }

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = BrandLogoStorage::replace(
                $fandom->cover_image,
                $request->file('cover_image'),
                'fandoms',
            );
        }

        $fandom->update($data);

        ActivityLog::record('fandom.updated', "Updated fandom {$fandom->name}");

        return response()->json(
            $fandom->fresh()->loadCount(['leagues', 'subsets', 'follows', 'polls']),
        );
    }

    public function destroy(Fandom $fandom): JsonResponse
    {
        Gate::authorize('manageFandoms');

        ActivityLog::record('fandom.deleted', "Deleted fandom {$fandom->name}");
        BrandLogoStorage::delete($fandom->cover_image);
        $fandom->delete();

        return response()->json(['message' => 'Fandom deleted.']);
    }

    private function resolveSlug(?string $slug, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug ?: $name);
        $candidate = $base;
        $suffix = 1;

        while (
            Fandom::query()
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
