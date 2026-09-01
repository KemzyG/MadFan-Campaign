<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Fandom;
use App\Models\Season;
use App\Models\Showdown;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ShowdownsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('managePolls');

        $showdowns = Showdown::query()
            ->with([
                'fandom:id,name',
                'season:id,name',
                'contestantA:id,name,username,fan_id',
                'contestantB:id,name,username,fan_id',
            ])
            ->when($request->filled('fandom_id'), fn ($query) => $query->where('fandom_id', $request->integer('fandom_id')))
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->latest()
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Showdowns/Index', [
            'showdowns' => $showdowns,
            'filters' => [
                'fandom_id' => $request->integer('fandom_id') ?: null,
                'is_active' => $request->has('is_active') ? $request->boolean('is_active') : null,
            ],
            'fandoms' => Fandom::query()->orderBy('name')->get(['id', 'name']),
            'seasons' => Season::query()->orderByDesc('id')->get(['id', 'name']),
        ]);
    }
}
