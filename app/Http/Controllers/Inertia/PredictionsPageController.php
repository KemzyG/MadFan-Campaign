<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Fandom;
use App\Models\MatchFixture;
use App\Models\Prediction;
use App\Models\Season;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PredictionsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('managePredictions');

        $predictions = Prediction::query()
            ->with(['matchFixture.homeClub:id,name', 'matchFixture.awayClub:id,name', 'fandom:id,name'])
            ->withCount('userPredictions')
            ->latest()
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Predictions/Index', [
            'predictions' => $predictions,
            'fandoms' => Fandom::query()->orderBy('name')->get(['id', 'name']),
            'seasons' => Season::query()->orderByDesc('id')->get(['id', 'name']),
            'fixtures' => MatchFixture::query()
                ->with(['homeClub:id,name', 'awayClub:id,name'])
                ->orderByDesc('kickoff_at')
                ->limit(100)
                ->get(['id', 'home_club_id', 'away_club_id', 'kickoff_at', 'competition']),
            'choices' => [Prediction::CHOICE_HOME, Prediction::CHOICE_DRAW, Prediction::CHOICE_AWAY],
        ]);
    }
}
