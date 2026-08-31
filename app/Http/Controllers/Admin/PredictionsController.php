<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Prediction;
use App\Services\Social\PredictionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class PredictionsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('managePredictions');

        $predictions = Prediction::query()
            ->with(['matchFixture.homeClub:id,name', 'matchFixture.awayClub:id,name', 'fandom:id,name'])
            ->withCount('userPredictions')
            ->when($request->filled('fandom_id'), fn ($query) => $query->where('fandom_id', $request->integer('fandom_id')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($predictions);
    }

    public function show(Prediction $prediction): JsonResponse
    {
        Gate::authorize('managePredictions');

        return response()->json(
            $prediction->load(['matchFixture.homeClub:id,name', 'matchFixture.awayClub:id,name', 'fandom:id,name', 'season:id,name'])
                ->loadCount('userPredictions'),
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('managePredictions');

        $data = $request->validate([
            'match_fixture_id' => ['required', 'integer', 'exists:match_fixtures,id', 'unique:predictions,match_fixture_id'],
            'fandom_id' => ['nullable', 'integer', 'exists:fandoms,id'],
            'season_id' => ['nullable', 'integer', 'exists:seasons,id'],
            'points_reward' => ['required', 'integer', 'min:1'],
            'closes_at' => ['required', 'date'],
        ]);

        $prediction = Prediction::query()->create($data);

        ActivityLog::record('prediction.created', "Created prediction #{$prediction->id}");

        return response()->json(
            $prediction->load(['matchFixture.homeClub:id,name', 'matchFixture.awayClub:id,name', 'fandom:id,name']),
            201,
        );
    }

    public function update(Request $request, Prediction $prediction, PredictionService $predictions): JsonResponse
    {
        Gate::authorize('managePredictions');

        $data = $request->validate([
            'fandom_id' => ['nullable', 'integer', 'exists:fandoms,id'],
            'season_id' => ['nullable', 'integer', 'exists:seasons,id'],
            'points_reward' => ['sometimes', 'integer', 'min:1'],
            'closes_at' => ['sometimes', 'date'],
            'correct_choice' => ['nullable', Rule::in([Prediction::CHOICE_HOME, Prediction::CHOICE_DRAW, Prediction::CHOICE_AWAY])],
        ]);

        $correctChoice = $data['correct_choice'] ?? null;
        unset($data['correct_choice']);

        $prediction->update($data);

        // Route a manual settle through the real resolve flow rather than
        // writing correct_choice/resolved_at directly — that used to mark
        // the prediction resolved without ever scoring a single guess or
        // paying out a point (see PredictionService::resolve()'s $forceChoice).
        if ($correctChoice !== null) {
            $predictions->resolve($prediction->fresh(), $correctChoice);
        }

        ActivityLog::record('prediction.updated', "Updated prediction #{$prediction->id}");

        return response()->json(
            $prediction->fresh()->load(['matchFixture.homeClub:id,name', 'matchFixture.awayClub:id,name', 'fandom:id,name']),
        );
    }

    public function destroy(Prediction $prediction): JsonResponse
    {
        Gate::authorize('managePredictions');

        ActivityLog::record('prediction.deleted', "Deleted prediction #{$prediction->id}");
        $prediction->userPredictions()->delete();
        $prediction->delete();

        return response()->json(['message' => 'Prediction deleted.']);
    }
}
