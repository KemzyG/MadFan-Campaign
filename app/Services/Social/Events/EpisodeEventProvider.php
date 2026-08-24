<?php

namespace App\Services\Social\Events;

use App\Enums\EventPhase;
use App\Enums\EventType;
use App\Models\User;
use App\Models\VideoHighlight;
use App\Support\Social\EventCard;
use App\Support\Social\EventWindow;

/**
 * Recently-published highlights → `new_episode`.
 *
 * Only reels published inside the recency window make the events feed; the
 * full back catalogue stays on /social/videos.
 */
class EpisodeEventProvider implements EventProvider
{
    private const LIMIT = 6;

    public function cards(User $viewer): iterable
    {
        $episodes = VideoHighlight::query()
            ->published()
            ->where('published_at', '>=', EventWindow::recentSince())
            ->with(['club:id,name,short,logo', 'author:id,name,handle,username,fan_id'])
            ->latest('published_at')
            ->limit(self::LIMIT)
            ->get();

        foreach ($episodes as $episode) {
            yield new EventCard(
                key: EventType::NewEpisode->value.':'.$episode->id,
                type: EventType::NewEpisode,
                phase: EventPhase::Recent,
                timestamp: $episode->published_at,
                headline: $episode->title,
                subtitle: $episode->caption,
                club: $episode->club ? [
                    'id' => $episode->club->id,
                    'name' => $episode->club->name,
                    'short' => $episode->club->short,
                    'logo_url' => $episode->club->logo_url,
                ] : null,
                cta: ['label' => 'Watch', 'href' => '/social/videos?highlight='.$episode->id],
                share: ['title' => $episode->title, 'url' => '/social/videos?highlight='.$episode->id],
                data: [
                    'thumbnail_url' => $episode->thumbnail_url,
                    'duration_seconds' => $episode->duration_seconds,
                    'views_count' => $episode->views_count,
                    'likes_count' => $episode->likes_count,
                    'is_featured' => (bool) $episode->is_featured,
                    'author' => $episode->author ? [
                        'id' => $episode->author->id,
                        'name' => $episode->author->name,
                        'handle' => $episode->author->handle
                            ?: $episode->author->username
                            ?: $episode->author->fan_id,
                    ] : null,
                ],
            );
        }
    }
}
