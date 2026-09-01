<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StageStatus;
use App\Enums\StageType;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Stage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StagesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageStages');

        $stages = Stage::query()
            ->with(['host:id,name,username', 'club:id,name'])
            ->withCount('participants')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('search'), fn ($query) => $query->where('title', 'like', '%'.$request->string('search').'%'))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($stages);
    }

    public function show(Stage $stage): JsonResponse
    {
        Gate::authorize('manageStages');

        return response()->json(
            $stage->load(['host:id,name,username,email', 'club:id,name'])
                ->loadCount(['participants', 'messages']),
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('manageStages');

        $data = $request->validate([
            'host_id' => ['required', 'integer', 'exists:users,id'],
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(StageType::class)],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_public' => ['sometimes', 'boolean'],
            'allow_invite' => ['sometimes', 'boolean'],
            'allow_chat' => ['sometimes', 'boolean'],
            'allow_speak_requests' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::enum(StageStatus::class)],
            'voice_enabled' => ['sometimes', 'boolean'],
            'max_speakers' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $data['is_public'] = $request->boolean('is_public', true);
        $data['allow_invite'] = $request->boolean('allow_invite', true);
        $data['allow_chat'] = $request->boolean('allow_chat', true);
        $data['allow_speak_requests'] = $request->boolean('allow_speak_requests', true);
        $data['voice_enabled'] = $request->boolean('voice_enabled', true);
        $data['status'] ??= StageStatus::Live->value;
        $data['started_at'] ??= now();
        $data['max_speakers'] ??= 8;

        $stage = Stage::query()->create($data);

        ActivityLog::record('stage.created', "Created stage {$stage->title}");

        return response()->json($stage->load(['host:id,name,username', 'club:id,name']), 201);
    }

    public function update(Request $request, Stage $stage): JsonResponse
    {
        Gate::authorize('manageStages');

        $data = $request->validate([
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', Rule::enum(StageType::class)],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_public' => ['sometimes', 'boolean'],
            'allow_invite' => ['sometimes', 'boolean'],
            'allow_chat' => ['sometimes', 'boolean'],
            'allow_speak_requests' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::enum(StageStatus::class)],
            'voice_enabled' => ['sometimes', 'boolean'],
            'max_speakers' => ['nullable', 'integer', 'min:1', 'max:50'],
            'ended_at' => ['nullable', 'date'],
        ]);

        if (($data['status'] ?? null) === StageStatus::Ended->value && empty($data['ended_at'])) {
            $data['ended_at'] = now();
        }

        $stage->update($data);

        ActivityLog::record('stage.updated', "Updated stage {$stage->title}");

        return response()->json($stage->fresh()->load(['host:id,name,username', 'club:id,name']));
    }

    public function destroy(Stage $stage): JsonResponse
    {
        Gate::authorize('manageStages');

        ActivityLog::record('stage.deleted', "Deleted stage {$stage->title}");
        $stage->delete();

        return response()->json(['message' => 'Stage deleted.']);
    }
}
