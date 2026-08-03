<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreClubRequest;
use App\Http\Requests\Admin\UpdateClubRequest;
use App\Models\ActivityLog;
use App\Models\Club;
use App\Support\BrandLogoStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ClubsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageClubs');

        $clubs = Club::query()
            ->with('league:id,name,short')
            ->when($request->filled('league_id'), fn ($query) => $query->where('league_id', $request->integer('league_id')))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return response()->json($clubs);
    }

    public function show(Club $club): JsonResponse
    {
        Gate::authorize('manageClubs');

        return response()->json($club->load('league:id,name,short'));
    }

    public function store(StoreClubRequest $request): JsonResponse
    {
        Gate::authorize('manageClubs');

        $data = $request->safe()->only(['league_id', 'name', 'short']);

        if ($request->hasFile('logo')) {
            $data['logo'] = BrandLogoStorage::store($request->file('logo'), 'clubs');
        }

        $club = Club::create($data);

        ActivityLog::record('club.created', "Created club {$club->name}");

        return response()->json($club->load('league:id,name,short'), 201);
    }

    public function update(UpdateClubRequest $request, Club $club): JsonResponse
    {
        Gate::authorize('manageClubs');

        $data = $request->safe()->only(['league_id', 'name', 'short']);

        if ($request->boolean('remove_logo') && ! $request->hasFile('logo')) {
            BrandLogoStorage::delete($club->logo);
            $data['logo'] = null;
        }

        if ($request->hasFile('logo')) {
            $data['logo'] = BrandLogoStorage::replace($club->logo, $request->file('logo'), 'clubs');
        }

        $club->update($data);

        ActivityLog::record('club.updated', "Updated club {$club->name}");

        return response()->json($club->fresh()->load('league:id,name,short'));
    }

    public function destroy(Club $club): JsonResponse
    {
        Gate::authorize('manageClubs');

        ActivityLog::record('club.deleted', "Deleted club {$club->name}");
        BrandLogoStorage::delete($club->logo);
        $club->delete();

        return response()->json(['message' => 'Club deleted.']);
    }
}
