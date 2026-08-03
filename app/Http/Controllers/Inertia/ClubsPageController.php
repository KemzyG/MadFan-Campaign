<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\League;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClubsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageClubs');

        $clubs = Club::query()
            ->with('league:id,name,short')
            ->when($request->filled('league_id'), fn ($query) => $query->where('league_id', $request->integer('league_id')))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Clubs/Index', [
            'clubs' => $clubs,
            'leagues' => League::query()->orderBy('name')->get(['id', 'name', 'short']),
            'filters' => [
                'league_id' => $request->integer('league_id') ?: null,
            ],
        ]);
    }
}
