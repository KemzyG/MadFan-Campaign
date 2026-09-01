<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\ChannelType;
use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\ClubServer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ChannelsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageChannels');

        $channels = Channel::query()
            ->with(['clubServer.club:id,name', 'createdBy:id,name'])
            ->withCount(['messages', 'memberships'])
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.$request->string('search').'%'))
            ->orderBy('position')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Channels/Index', [
            'channels' => $channels,
            'filters' => [
                'search' => $request->string('search')->toString() ?: null,
            ],
            'clubServers' => ClubServer::query()->with('club:id,name')->get(['id', 'club_id']),
            'types' => array_map(fn (ChannelType $type) => $type->value, ChannelType::cases()),
        ]);
    }
}
