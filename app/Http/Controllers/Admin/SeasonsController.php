<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSeasonRequest;
use App\Http\Requests\Admin\UpdateSeasonRequest;
use App\Models\ActivityLog;
use App\Models\Season;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SeasonsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageSeasons');
        $seasons = Season::withCount('tasks', 'seasonWeeks')
            ->orderByDesc('starts_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($seasons);
    }

    public function show(Season $season): JsonResponse
    {
        Gate::authorize('manageSeasons');

        return response()->json($season->load('seasonWeeks', 'tasks', 'earnSources'));
    }

    public function store(StoreSeasonRequest $request): JsonResponse
    {
        Gate::authorize('manageSeasons');
        $data = $request->validated();
        $data['total_weeks'] ??= 4;

        $season = Season::create($data);

        ActivityLog::record('season.created', "Created season {$season->name}");

        return response()->json($season, 201);
    }

    public function update(UpdateSeasonRequest $request, Season $season): JsonResponse
    {
        Gate::authorize('manageSeasons');
        $season->update($request->validated());

        ActivityLog::record('season.updated', "Updated season {$season->name}");

        return response()->json($season->fresh());
    }

    public function destroy(Season $season): JsonResponse
    {
        Gate::authorize('manageSeasons');
        ActivityLog::record('season.deleted', "Deleted season {$season->name}");
        $season->delete();

        return response()->json(['message' => 'Season deleted.']);
    }
}
