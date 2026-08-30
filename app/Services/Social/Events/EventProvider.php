<?php

namespace App\Services\Social\Events;

use App\Models\User;
use App\Services\Social\EventFeedService;
use App\Support\Social\EventCard;

/**
 * A source of {@see EventCard}s for the Social events feed. Each provider owns
 * one origin (fixtures, stages, announcements, …) and returns already-built
 * cards; the {@see EventFeedService} handles merging,
 * ordering, interest counts, and pagination.
 */
interface EventProvider
{
    /**
     * Build every currently-relevant card from this source for the viewer.
     *
     * Providers should cap their own output (a sane per-source limit) so one
     * noisy source can't crowd the merged feed; the service paginates the union.
     *
     * @return iterable<EventCard>
     */
    public function cards(?User $viewer): iterable;
}
