<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Season;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SeasonsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageSeasons');

        $seasons = Season::query()
            ->withCount('tasks', 'seasonWeeks')
            ->orderByDesc('starts_at')
            ->paginate($request->per_page ?? 20)
            ->withQueryString();

        return Inertia::render('Admin/Seasons/Index', [
            'seasons' => $seasons,
        ]);
    }
}
