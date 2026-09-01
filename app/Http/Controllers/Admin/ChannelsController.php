<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ChannelScope;
use App\Enums\ChannelType;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Channel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ChannelsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageChannels');

        $channels = Channel::query()
            ->with(['clubServer.club:id,name', 'createdBy:id,name'])
            ->withCount(['messages', 'memberships'])
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->orderBy('position')
            ->paginate($request->integer('per_page', 20));

        return response()->json($channels);
    }

    public function show(Channel $channel): JsonResponse
    {
        Gate::authorize('manageChannels');

        return response()->json(
            $channel->load(['clubServer.club:id,name', 'createdBy:id,name,email'])
                ->loadCount(['messages', 'memberships']),
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('manageChannels');

        $data = $request->validate([
            'club_server_id' => ['required', 'integer', 'exists:club_servers,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash'],
            'type' => ['required', Rule::enum(ChannelType::class)],
            'topic' => ['nullable', 'string', 'max:500'],
            'position' => ['nullable', 'integer', 'min:0'],
            'slowmode_seconds' => ['nullable', 'integer', 'min:0'],
            'is_read_only' => ['sometimes', 'boolean'],
            'created_by_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $data['slug'] ??= str($data['name'])->slug()->toString();
        $data['is_read_only'] = $request->boolean('is_read_only', false);
        $data['position'] ??= 0;
        $data['slowmode_seconds'] ??= 0;
        $data['created_by_id'] ??= $request->user()?->id;
        $data['scope'] = ChannelScope::Club;

        $channel = Channel::query()->create($data);

        ActivityLog::record('channel.created', "Created channel {$channel->name}");

        return response()->json($channel->load(['clubServer.club:id,name']), 201);
    }

    public function update(Request $request, Channel $channel): JsonResponse
    {
        Gate::authorize('manageChannels');

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:255', 'alpha_dash'],
            'type' => ['sometimes', Rule::enum(ChannelType::class)],
            'topic' => ['nullable', 'string', 'max:500'],
            'position' => ['nullable', 'integer', 'min:0'],
            'slowmode_seconds' => ['nullable', 'integer', 'min:0'],
            'is_read_only' => ['sometimes', 'boolean'],
        ]);

        $channel->update($data);

        ActivityLog::record('channel.updated', "Updated channel {$channel->name}");

        return response()->json($channel->fresh()->load(['clubServer.club:id,name']));
    }

    public function destroy(Channel $channel): JsonResponse
    {
        Gate::authorize('manageChannels');

        ActivityLog::record('channel.deleted', "Deleted channel {$channel->name}");
        $channel->delete();

        return response()->json(['message' => 'Channel deleted.']);
    }
}
