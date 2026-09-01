<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Fandom;
use App\Models\Poll;
use App\Models\Season;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PollsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('managePolls');

        $polls = Poll::query()
            ->with(['fandom:id,name', 'options'])
            ->withCount('votes')
            ->when($request->filled('fandom_id'), fn ($query) => $query->where('fandom_id', $request->integer('fandom_id')))
            ->latest()
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Polls/Index', [
            'polls' => $polls,
            'filters' => [
                'fandom_id' => $request->integer('fandom_id') ?: null,
            ],
            'fandoms' => Fandom::query()->orderBy('name')->get(['id', 'name']),
            'seasons' => Season::query()->orderByDesc('id')->get(['id', 'name']),
        ]);
    }
}
