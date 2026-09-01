<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\VideoHighlight;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class HighlightsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageHighlights');

        $highlights = VideoHighlight::query()
            ->with(['author:id,name,username', 'club:id,name'])
            ->when($request->filled('search'), fn ($query) => $query->where('title', 'like', '%'.$request->string('search').'%'))
            ->when($request->has('is_featured'), fn ($query) => $query->where('is_featured', $request->boolean('is_featured')))
            ->latest('published_at')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Highlights/Index', [
            'highlights' => $highlights,
            'filters' => [
                'search' => $request->string('search')->toString() ?: null,
                'is_featured' => $request->has('is_featured') ? $request->boolean('is_featured') : null,
            ],
            'clubs' => Club::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
