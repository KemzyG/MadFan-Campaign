<?php

namespace App\Services\Social;

use App\Models\User;
use App\Models\VideoHighlight;
use App\Models\VideoHighlightLike;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class VideoHighlightService
{
    public const MAX_UPLOAD_KB = 51200;

    public const MAX_DURATION_SECONDS = 90;

    public const MAX_CAPTION_LENGTH = 500;

    /**
     * @return LengthAwarePaginator<int, VideoHighlight>
     */
    public function feed(int $perPage = 20): LengthAwarePaginator
    {
        return VideoHighlight::query()
            ->published()
            ->with(['author:id,name,handle,avatar_path,updated_at', 'club:id,name,short,logo'])
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * @param  Collection<int, VideoHighlight>|array<int, VideoHighlight>  $highlights
     * @return list<array<string, mixed>>
     */
    public function presentMany(Collection|array $highlights, User $viewer): array
    {
        $items = $highlights instanceof Collection ? $highlights->all() : $highlights;

        if ($items === []) {
            return [];
        }

        $likedIds = VideoHighlightLike::query()
            ->where('user_id', $viewer->id)
            ->whereIn('video_highlight_id', collect($items)->pluck('id'))
            ->pluck('video_highlight_id')
            ->all();

        $likedMap = array_fill_keys($likedIds, true);

        return array_map(
            fn (VideoHighlight $highlight) => $this->present($highlight, $viewer, $likedMap),
            $items,
        );
    }

    /**
     * @param  array<int, true>  $likedMap
     * @return array<string, mixed>
     */
    public function present(VideoHighlight $highlight, User $viewer, array $likedMap = []): array
    {
        $author = $highlight->author;
        $club = $highlight->club;

        return [
            'id' => $highlight->id,
            'title' => $highlight->title,
            'caption' => $highlight->caption,
            'video_url' => $highlight->video_url,
            'thumbnail_url' => $highlight->thumbnail_url,
            'duration_seconds' => $highlight->duration_seconds,
            'likes_count' => $highlight->likes_count,
            'views_count' => $highlight->views_count,
            'is_featured' => $highlight->is_featured,
            'published_at' => $highlight->published_at?->toIso8601String(),
            'liked' => isset($likedMap[$highlight->id]) || $highlight->isLikedBy($viewer),
            'author' => $author ? [
                'id' => $author->id,
                'name' => $author->name,
                'handle' => $author->handle,
                'avatar_url' => $author->avatar_url ?? null,
            ] : null,
            'club' => $club ? [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
            ] : null,
        ];
    }

    public function toggleLike(VideoHighlight $highlight, User $user): array
    {
        $existing = VideoHighlightLike::query()
            ->where('user_id', $user->id)
            ->where('video_highlight_id', $highlight->id)
            ->first();

        if ($existing !== null) {
            $existing->delete();
            $highlight->decrement('likes_count');

            return [
                'liked' => false,
                'likes_count' => max(0, $highlight->fresh()->likes_count),
            ];
        }

        VideoHighlightLike::query()->create([
            'user_id' => $user->id,
            'video_highlight_id' => $highlight->id,
            'created_at' => now(),
        ]);
        $highlight->increment('likes_count');

        return [
            'liked' => true,
            'likes_count' => $highlight->fresh()->likes_count,
        ];
    }

    public function recordView(VideoHighlight $highlight): int
    {
        $highlight->increment('views_count');

        return $highlight->fresh()->views_count;
    }
}
