<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\EventType;
use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\SocialAnnouncement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageAnnouncements');

        $announcements = SocialAnnouncement::query()
            ->with('club:id,name')
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->when($request->filled('search'), fn ($query) => $query->where('headline', 'like', '%'.$request->string('search').'%'))
            ->latest('published_at')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Announcements/Index', [
            'announcements' => $announcements,
            'filters' => [
                'type' => $request->string('type')->toString() ?: null,
                'search' => $request->string('search')->toString() ?: null,
            ],
            'clubs' => Club::query()->orderBy('name')->get(['id', 'name']),
            'types' => EventType::editorialValues(),
        ]);
    }
}
