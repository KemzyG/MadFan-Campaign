<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Poll;
use App\Models\PollOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class PollsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('managePolls');

        $polls = Poll::query()
            ->with(['fandom:id,name', 'options'])
            ->withCount('votes')
            ->when($request->filled('fandom_id'), fn ($query) => $query->where('fandom_id', $request->integer('fandom_id')))
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($polls);
    }

    public function show(Poll $poll): JsonResponse
    {
        Gate::authorize('managePolls');

        return response()->json($poll->load(['fandom:id,name', 'season:id,name', 'options'])->loadCount('votes'));
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('managePolls');

        $data = $request->validate([
            'fandom_id' => ['nullable', 'integer', 'exists:fandoms,id'],
            'season_id' => ['nullable', 'integer', 'exists:seasons,id'],
            'question' => ['required', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            // Every vote needs a close date so it drops off the Events feed
            // on its own instead of running forever.
            'closes_at' => ['required', 'date', 'after:now'],
            'options' => ['required', 'array', 'min:2'],
            'options.*' => ['required', 'string', 'max:255'],
        ]);

        $poll = DB::transaction(function () use ($data, $request): Poll {
            $poll = Poll::query()->create([
                'fandom_id' => $data['fandom_id'] ?? null,
                'season_id' => $data['season_id'] ?? null,
                'question' => $data['question'],
                'is_active' => $request->boolean('is_active', true),
                'closes_at' => $data['closes_at'] ?? null,
            ]);

            foreach (array_values($data['options']) as $index => $label) {
                PollOption::query()->create([
                    'poll_id' => $poll->id,
                    'label' => $label,
                    'sort_order' => $index,
                    'votes_count' => 0,
                ]);
            }

            return $poll;
        });

        ActivityLog::record('poll.created', "Created poll {$poll->question}");

        return response()->json($poll->load(['fandom:id,name', 'options'])->loadCount('votes'), 201);
    }

    public function update(Request $request, Poll $poll): JsonResponse
    {
        Gate::authorize('managePolls');

        $data = $request->validate([
            'fandom_id' => ['nullable', 'integer', 'exists:fandoms,id'],
            'season_id' => ['nullable', 'integer', 'exists:seasons,id'],
            'question' => ['sometimes', 'required', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            'closes_at' => ['sometimes', 'required', 'date'],
        ]);

        $poll->update($data);

        ActivityLog::record('poll.updated', "Updated poll {$poll->question}");

        return response()->json($poll->fresh()->load(['fandom:id,name', 'options'])->loadCount('votes'));
    }

    public function destroy(Poll $poll): JsonResponse
    {
        Gate::authorize('managePolls');

        ActivityLog::record('poll.deleted', "Deleted poll {$poll->question}");
        $poll->options()->delete();
        $poll->votes()->delete();
        $poll->delete();

        return response()->json(['message' => 'Poll deleted.']);
    }
}
