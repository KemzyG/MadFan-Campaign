<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Fandom;
use App\Models\League;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LeaguesPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageLeagues');

        $leagues = League::query()
            ->with('fandom:id,name')
            ->withCount('clubs')
            ->when($request->filled('fandom_id'), fn ($query) => $query->where('fandom_id', $request->integer('fandom_id')))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Leagues/Index', [
            'leagues' => $leagues,
            'fandoms' => Fandom::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'fandom_id' => $request->integer('fandom_id') ?: null,
            ],
        ]);
    }
}
