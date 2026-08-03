<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLeagueRequest;
use App\Http\Requests\Admin\UpdateLeagueRequest;
use App\Models\ActivityLog;
use App\Models\League;
use App\Support\BrandLogoStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class LeaguesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageLeagues');

        $leagues = League::query()
            ->withCount('clubs')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return response()->json($leagues);
    }

    public function show(League $league): JsonResponse
    {
        Gate::authorize('manageLeagues');

        return response()->json($league->loadCount('clubs')->load('clubs'));
    }

    public function store(StoreLeagueRequest $request): JsonResponse
    {
        Gate::authorize('manageLeagues');

        $data = $request->safe()->only(['name', 'short']);

        if ($request->hasFile('logo')) {
            $data['logo'] = BrandLogoStorage::store($request->file('logo'), 'leagues');
        }

        $league = League::create($data);

        ActivityLog::record('league.created', "Created league {$league->name}");

        return response()->json($league->loadCount('clubs'), 201);
    }

    public function update(UpdateLeagueRequest $request, League $league): JsonResponse
    {
        Gate::authorize('manageLeagues');

        $data = $request->safe()->only(['name', 'short']);

        if ($request->boolean('remove_logo') && ! $request->hasFile('logo')) {
            BrandLogoStorage::delete($league->logo);
            $data['logo'] = null;
        }

        if ($request->hasFile('logo')) {
            $data['logo'] = BrandLogoStorage::replace($league->logo, $request->file('logo'), 'leagues');
        }

        $league->update($data);

        ActivityLog::record('league.updated', "Updated league {$league->name}");

        return response()->json($league->fresh()->loadCount('clubs'));
    }

    public function destroy(League $league): JsonResponse
    {
        Gate::authorize('manageLeagues');

        ActivityLog::record('league.deleted', "Deleted league {$league->name}");
        BrandLogoStorage::delete($league->logo);
        $league->delete();

        return response()->json(['message' => 'League deleted.']);
    }
}
