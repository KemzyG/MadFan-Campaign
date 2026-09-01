<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PostsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('managePosts');

        $posts = Post::query()
            ->with(['author:id,name,username', 'club:id,name'])
            ->withCount(['likes', 'media'])
            ->when($request->filled('search'), function ($query) use ($request): void {
                $term = '%'.$request->string('search').'%';
                $query->where(function ($inner) use ($term): void {
                    $inner->where('body', 'like', $term)
                        ->orWhereHas('author', fn ($author) => $author->where('name', 'like', $term));
                });
            })
            ->when($request->has('is_hidden'), fn ($query) => $query->where('is_hidden', $request->boolean('is_hidden')))
            ->latest('published_at')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Posts/Index', [
            'posts' => $posts,
            'filters' => [
                'search' => $request->string('search')->toString() ?: null,
                'is_hidden' => $request->has('is_hidden') ? $request->boolean('is_hidden') : null,
            ],
            'clubs' => Club::query()->orderBy('name')->get(['id', 'name']),
            'types' => array_map(fn (PostType $type) => $type->value, PostType::cases()),
            'visibilities' => array_map(fn (PostVisibility $visibility) => $visibility->value, PostVisibility::cases()),
        ]);
    }
}
