<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Showdown;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Not yet routed — routes/web.php's admin group is where this belongs
 * (alongside Route::apiResource('polls', PollsController::class) etc.),
 * left untouched here because it's mid-edit elsewhere. Add:
 *   Route::apiResource('showdowns', ShowdownsController::class);
 * inside the same `admin.api.` group as `polls`/`predictions`, and this
 * controller is ready to go — see also AdminPermission::PollsManage, reused
 * here rather than adding a new permission case to that same contended file.
 */
class ShowdownsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('managePolls');

        $showdowns = Showdown::query()
            ->with(['fandom:id,name', 'contestantA:id,name,handle', 'contestantB:id,name,handle'])
            ->when($request->filled('fandom_id'), fn ($query) => $query->where('fandom_id', $request->integer('fandom_id')))
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($showdowns);
    }

    public function show(Showdown $showdown): JsonResponse
    {
        Gate::authorize('managePolls');

        return response()->json(
            $showdown->load(['fandom:id,name', 'season:id,name', 'contestantA:id,name,handle,avatar_path', 'contestantB:id,name,handle,avatar_path']),
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('managePolls');

        $data = $request->validate([
            'fandom_id' => ['nullable', 'integer', 'exists:fandoms,id'],
            'season_id' => ['nullable', 'integer', 'exists:seasons,id'],
            'title' => ['required', 'string', 'max:255'],
            'contestant_a_user_id' => ['required', 'integer', 'exists:users,id', 'different:contestant_b_user_id'],
            'contestant_b_user_id' => ['required', 'integer', 'exists:users,id'],
            'is_active' => ['sometimes', 'boolean'],
            'closes_at' => ['nullable', 'date'],
        ]);

        $showdown = Showdown::query()->create([
            ...$data,
            'is_active' => $request->boolean('is_active', true),
        ]);

        ActivityLog::record('showdown.created', "Created showdown {$showdown->title}");

        return response()->json(
            $showdown->load(['fandom:id,name', 'contestantA:id,name,handle', 'contestantB:id,name,handle']),
            201,
        );
    }

    public function update(Request $request, Showdown $showdown): JsonResponse
    {
        Gate::authorize('managePolls');

        $data = $request->validate([
            'fandom_id' => ['nullable', 'integer', 'exists:fandoms,id'],
            'season_id' => ['nullable', 'integer', 'exists:seasons,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'closes_at' => ['nullable', 'date'],
        ]);

        $showdown->update($data);

        ActivityLog::record('showdown.updated', "Updated showdown {$showdown->title}");

        return response()->json(
            $showdown->fresh()->load(['fandom:id,name', 'contestantA:id,name,handle', 'contestantB:id,name,handle']),
        );
    }

    public function destroy(Showdown $showdown): JsonResponse
    {
        Gate::authorize('managePolls');

        ActivityLog::record('showdown.deleted', "Deleted showdown {$showdown->title}");
        $showdown->votes()->delete();
        $showdown->voteEvents()->delete();
        $showdown->delete();

        return response()->json(['message' => 'Showdown deleted.']);
    }
}
