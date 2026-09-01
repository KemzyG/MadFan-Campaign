<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\StageStatus;
use App\Enums\StageType;
use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Stage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StagesPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageStages');

        $stages = Stage::query()
            ->with(['host:id,name,username', 'club:id,name'])
            ->withCount('participants')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('search'), fn ($query) => $query->where('title', 'like', '%'.$request->string('search').'%'))
            ->latest()
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Stages/Index', [
            'stages' => $stages,
            'filters' => [
                'status' => $request->string('status')->toString() ?: null,
                'search' => $request->string('search')->toString() ?: null,
            ],
            'clubs' => Club::query()->orderBy('name')->get(['id', 'name']),
            'statuses' => array_map(fn (StageStatus $status) => $status->value, StageStatus::cases()),
            'types' => array_map(fn (StageType $type) => $type->value, StageType::cases()),
        ]);
    }
}
