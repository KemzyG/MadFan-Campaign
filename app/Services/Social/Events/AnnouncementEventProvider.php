<?php

namespace App\Services\Social\Events;

use App\Enums\EventPhase;
use App\Enums\EventType;
use App\Models\SocialAnnouncement;
use App\Models\User;
use App\Support\Social\EventCard;
use App\Support\Social\EventWindow;
use Carbon\CarbonInterface;

/**
 * The three editorial kinds — concert, song release, breaking news — read from
 * `social_announcements`. Each kind projects its own `meta` fields into the
 * card `data` its template consumes.
 */
class AnnouncementEventProvider implements EventProvider
{
    private const LIMIT = 12;

    public function cards(?User $viewer): iterable
    {
        $announcements = SocialAnnouncement::query()
            ->published()
            ->current()
            ->where('published_at', '>=', EventWindow::recentSince())
            ->with('club:id,name,short,logo')
            ->orderByDesc('is_pinned')
            ->latest('published_at')
            ->limit(self::LIMIT)
            ->get();

        foreach ($announcements as $announcement) {
            yield $this->card($announcement);
        }
    }

    private function card(SocialAnnouncement $announcement): EventCard
    {
        $type = $announcement->type;
        $phase = $this->phase($announcement);

        return new EventCard(
            key: $type->value.':'.$announcement->id,
            type: $type,
            phase: $phase,
            timestamp: $this->timestamp($announcement, $phase),
            headline: $announcement->headline,
            subtitle: $announcement->subtitle,
            club: $announcement->club ? [
                'id' => $announcement->club->id,
                'name' => $announcement->club->name,
                'short' => $announcement->club->short,
                'logo_url' => $announcement->club->logo_url,
            ] : null,
            cta: $this->cta($announcement),
            share: [
                'title' => $announcement->headline,
                'url' => $announcement->link_url ?: '/social',
            ],
            data: $this->data($announcement),
            // Urgent breaking news floats with the pinned rows even when nobody
            // remembered to tick the pin.
            isPinned: $announcement->is_pinned || (bool) $announcement->meta('is_urgent', false),
        );
    }

    private function phase(SocialAnnouncement $announcement): EventPhase
    {
        $startsAt = $announcement->starts_at;

        if ($startsAt !== null && $startsAt->isFuture()) {
            return EventPhase::Upcoming;
        }

        // Breaking news reads as live while it is still current; a concert that
        // has started is live too. Otherwise it's a recent drop.
        if ($announcement->type === EventType::BreakingNews) {
            return EventPhase::Live;
        }

        if ($startsAt !== null && ($announcement->ends_at === null || $announcement->ends_at->isFuture())) {
            return EventPhase::Live;
        }

        return EventPhase::Recent;
    }

    private function timestamp(SocialAnnouncement $announcement, EventPhase $phase): ?CarbonInterface
    {
        return match ($phase) {
            EventPhase::Upcoming => $announcement->starts_at,
            default => $announcement->published_at ?? $announcement->starts_at,
        };
    }

    /**
     * @return array{label: string, href: string}|null
     */
    private function cta(SocialAnnouncement $announcement): ?array
    {
        if (! filled($announcement->link_url)) {
            return null;
        }

        return [
            'label' => $announcement->link_label ?: $announcement->type->ctaLabel(),
            'href' => $announcement->link_url,
        ];
    }

    /**
     * Kind-specific card payload, drawn from the JSON `meta` column.
     *
     * @return array<string, mixed>
     */
    private function data(SocialAnnouncement $announcement): array
    {
        $base = [
            'image_url' => $announcement->imageUrl(),
            'starts_at' => $announcement->starts_at?->toIso8601String(),
            'ends_at' => $announcement->ends_at?->toIso8601String(),
        ];

        return match ($announcement->type) {
            EventType::Concert => [
                ...$base,
                'artist' => $announcement->meta('artist'),
                'venue' => $announcement->meta('venue'),
                'city' => $announcement->meta('city'),
                'lineup' => $announcement->meta('lineup', []),
            ],
            EventType::SongRelease => [
                ...$base,
                'artist' => $announcement->meta('artist'),
                'track' => $announcement->meta('track'),
                'album' => $announcement->meta('album'),
                'platform' => $announcement->meta('platform'),
            ],
            EventType::BreakingNews => [
                ...$base,
                'source' => $announcement->meta('source'),
                'is_urgent' => (bool) $announcement->meta('is_urgent', false),
                'category' => $announcement->meta('category'),
            ],
            default => $base,
        };
    }
}
