<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\VideoHighlight;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class HighlightsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageHighlights');

        $highlights = VideoHighlight::query()
            ->with(['author:id,name,username', 'club:id,name'])
            ->when($request->filled('search'), fn ($query) => $query->where('title', 'like', '%'.$request->string('search').'%'))
            ->when($request->has('is_featured'), fn ($query) => $query->where('is_featured', $request->boolean('is_featured')))
            ->latest('published_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($highlights);
    }

    public function show(VideoHighlight $highlight): JsonResponse
    {
        Gate::authorize('manageHighlights');

        return response()->json($highlight->load(['author:id,name,username', 'club:id,name'])->loadCount('likes'));
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('manageHighlights');

        $data = $request->validate([
            'author_id' => ['required', 'integer', 'exists:users,id'],
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'title' => ['required', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:5000'],
            'video_url' => ['required', 'url', 'max:2048'],
            'thumbnail_url' => ['nullable', 'url', 'max:2048'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'is_featured' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ]);

        $data['is_featured'] = $request->boolean('is_featured', false);
        $data['published_at'] ??= now();
        $data['likes_count'] = 0;
        $data['views_count'] = 0;

        $highlight = VideoHighlight::query()->create($data);

        ActivityLog::record('highlight.created', "Created highlight {$highlight->title}");

        return response()->json($highlight->load(['author:id,name,username', 'club:id,name']), 201);
    }

    public function update(Request $request, VideoHighlight $highlight): JsonResponse
    {
        Gate::authorize('manageHighlights');

        $data = $request->validate([
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:5000'],
            'video_url' => ['sometimes', 'url', 'max:2048'],
            'thumbnail_url' => ['nullable', 'url', 'max:2048'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'is_featured' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ]);

        $highlight->update($data);

        ActivityLog::record('highlight.updated', "Updated highlight {$highlight->title}");

        return response()->json($highlight->fresh()->load(['author:id,name,username', 'club:id,name']));
    }

    public function destroy(VideoHighlight $highlight): JsonResponse
    {
        Gate::authorize('manageHighlights');

        ActivityLog::record('highlight.deleted', "Deleted highlight {$highlight->title}");
        $highlight->delete();

        return response()->json(['message' => 'Highlight deleted.']);
    }
}
