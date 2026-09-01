<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Enums\ReplyScope;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class PostsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('managePosts');

        $posts = Post::query()
            ->with(['author:id,name,username,email', 'club:id,name'])
            ->withCount(['likes', 'media'])
            ->when($request->filled('search'), function ($query) use ($request): void {
                $term = '%'.$request->string('search').'%';
                $query->where(function ($inner) use ($term): void {
                    $inner->where('body', 'like', $term)
                        ->orWhereHas('author', fn ($author) => $author->where('name', 'like', $term)->orWhere('username', 'like', $term));
                });
            })
            ->when($request->filled('club_id'), fn ($query) => $query->where('club_id', $request->integer('club_id')))
            ->when($request->has('is_hidden'), fn ($query) => $query->where('is_hidden', $request->boolean('is_hidden')))
            ->latest('published_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($posts);
    }

    public function show(Post $post): JsonResponse
    {
        Gate::authorize('managePosts');

        return response()->json(
            $post->load(['author:id,name,username,email', 'club:id,name', 'media', 'taggedUsers:id,name,username'])
                ->loadCount(['likes', 'bookmarks', 'replies', 'views']),
        );
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('managePosts');

        $data = $request->validate([
            'author_id' => ['required', 'integer', 'exists:users,id'],
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'type' => ['required', Rule::enum(PostType::class)],
            'visibility' => ['required', Rule::enum(PostVisibility::class)],
            'reply_scope' => ['nullable', Rule::enum(ReplyScope::class)],
            'body' => ['nullable', 'string', 'max:10000'],
            'is_hidden' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ]);

        $data['reply_scope'] ??= ReplyScope::Everyone->value;
        $data['is_hidden'] = $request->boolean('is_hidden', false);
        $data['published_at'] ??= now();

        $post = Post::query()->create($data);

        ActivityLog::record('post.created', "Created post #{$post->id}");

        return response()->json($post->load(['author:id,name,username', 'club:id,name']), 201);
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        Gate::authorize('managePosts');

        $data = $request->validate([
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'type' => ['sometimes', Rule::enum(PostType::class)],
            'visibility' => ['sometimes', Rule::enum(PostVisibility::class)],
            'reply_scope' => ['nullable', Rule::enum(ReplyScope::class)],
            'body' => ['nullable', 'string', 'max:10000'],
            'is_hidden' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ]);

        $post->update($data);

        ActivityLog::record('post.updated', "Updated post #{$post->id}");

        return response()->json($post->fresh()->load(['author:id,name,username', 'club:id,name']));
    }

    public function destroy(Post $post): JsonResponse
    {
        Gate::authorize('managePosts');

        ActivityLog::record('post.deleted', "Deleted post #{$post->id}");
        $post->delete();

        return response()->json(['message' => 'Post deleted.']);
    }
}
