<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Fandom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FandomsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageFandoms');

        $fandoms = Fandom::query()
            ->withCount(['leagues', 'subsets', 'follows'])
            ->when($request->filled('group'), fn ($query) => $query->where('group', $request->string('group')))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $term = '%'.$request->string('search').'%';
                $query->where(function ($inner) use ($term): void {
                    $inner->where('name', 'like', $term)->orWhere('slug', 'like', $term);
                });
            })
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Fandoms/Index', [
            'fandoms' => $fandoms,
            'filters' => [
                'group' => $request->string('group')->toString() ?: null,
                'search' => $request->string('search')->toString() ?: null,
                'is_active' => $request->has('is_active') ? $request->boolean('is_active') : null,
            ],
            'groups' => ['sports', 'esports', 'music', 'books'],
        ]);
    }

    public function show(Fandom $fandom): Response
    {
        Gate::authorize('manageFandoms');

        $fandom->loadCount(['leagues', 'subsets', 'follows', 'polls', 'products', 'predictions']);
        $fandom->load([
            'subsets' => fn ($query) => $query->orderBy('sort_order'),
            'leagues' => fn ($query) => $query->withCount('clubs')->orderBy('name'),
        ]);

        return Inertia::render('Admin/Fandoms/Show', [
            'fandom' => $fandom,
            'analytics' => [
                'followers' => $fandom->follows_count,
                'leagues' => $fandom->leagues_count,
                'subsets' => $fandom->subsets_count,
                'polls' => $fandom->polls_count,
                'products' => $fandom->products_count,
                'predictions' => $fandom->predictions_count,
            ],
            'groups' => ['sports', 'esports', 'music', 'books'],
        ]);
    }
}
