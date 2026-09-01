<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\MatchStatus;
use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\MatchFixture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FixturesPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageFixtures');

        $fixtures = MatchFixture::query()
            ->with(['homeClub:id,name,short', 'awayClub:id,name,short'])
            ->withCount('tickets')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByDesc('kickoff_at')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Fixtures/Index', [
            'fixtures' => $fixtures,
            'filters' => [
                'status' => $request->string('status')->toString() ?: null,
            ],
            'clubs' => Club::query()->orderBy('name')->get(['id', 'name', 'short']),
            'statuses' => array_map(fn (MatchStatus $status) => $status->value, MatchStatus::cases()),
        ]);
    }
}
