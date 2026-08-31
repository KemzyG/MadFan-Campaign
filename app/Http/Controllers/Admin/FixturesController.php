<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MatchStatus;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\MatchFixture;
use App\Services\Social\PredictionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class FixturesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageFixtures');

        $fixtures = MatchFixture::query()
            ->with(['homeClub:id,name,short', 'awayClub:id,name,short'])
            ->withCount('tickets')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $term = '%'.$request->string('search').'%';
                $query->where(function ($inner) use ($term): void {
                    $inner->where('competition', 'like', $term)
                        ->orWhere('venue', 'like', $term)
                        ->orWhereHas('homeClub', fn ($club) => $club->where('name', 'like', $term))
                        ->orWhereHas('awayClub', fn ($club) => $club->where('name', 'like', $term));
                });
            })
            ->orderByDesc('kickoff_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($fixtures);
    }

    public function show(MatchFixture $fixture): JsonResponse
    {
        Gate::authorize('manageFixtures');

        return response()->json(
            $fixture->load(['homeClub:id,name,short', 'awayClub:id,name,short', 'prediction'])
                ->loadCount('tickets'),
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('manageFixtures');

        $data = $request->validate([
            'home_club_id' => ['required', 'integer', 'exists:clubs,id', 'different:away_club_id'],
            'away_club_id' => ['required', 'integer', 'exists:clubs,id'],
            'kickoff_at' => ['required', 'date'],
            'venue' => ['required', 'string', 'max:255'],
            'status' => ['required', Rule::enum(MatchStatus::class)],
            'home_score' => ['nullable', 'integer', 'min:0'],
            'away_score' => ['nullable', 'integer', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'competition' => ['nullable', 'string', 'max:255'],
        ]);

        $fixture = MatchFixture::query()->create($data);

        ActivityLog::record('fixture.created', "Created fixture #{$fixture->id}");

        return response()->json($fixture->load(['homeClub:id,name,short', 'awayClub:id,name,short']), 201);
    }

    public function update(Request $request, MatchFixture $fixture, PredictionService $predictions): JsonResponse
    {
        Gate::authorize('manageFixtures');

        $data = $request->validate([
            'home_club_id' => ['sometimes', 'integer', 'exists:clubs,id'],
            'away_club_id' => ['sometimes', 'integer', 'exists:clubs,id'],
            'kickoff_at' => ['sometimes', 'date'],
            'venue' => ['sometimes', 'required', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(MatchStatus::class)],
            'home_score' => ['nullable', 'integer', 'min:0'],
            'away_score' => ['nullable', 'integer', 'min:0'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'competition' => ['nullable', 'string', 'max:255'],
        ]);

        $fixture->update($data);

        // Same "Finished + both scores set → settle the linked prediction"
        // step the Filament fixture editor already does in its own afterSave
        // hook (EditMatchFixture::afterSave) — this is the *other* place a
        // fixture's score gets written, so without this call here too,
        // predictions settled through this panel never resolve: no correct/
        // incorrect marks, no points, "Final" never renders. resolve() is
        // itself idempotent (a no-op if already resolved, or if the fixture
        // isn't Finished with both scores yet), so it's safe to call on
        // every update rather than only when status changes to Finished.
        $prediction = $fixture->fresh()->prediction;
        if ($prediction !== null) {
            $predictions->resolve($prediction);
        }

        ActivityLog::record('fixture.updated', "Updated fixture #{$fixture->id}");

        return response()->json($fixture->fresh()->load(['homeClub:id,name,short', 'awayClub:id,name,short']));
    }

    public function destroy(MatchFixture $fixture): JsonResponse
    {
        Gate::authorize('manageFixtures');

        ActivityLog::record('fixture.deleted', "Deleted fixture #{$fixture->id}");
        $fixture->delete();

        return response()->json(['message' => 'Fixture deleted.']);
    }
}
