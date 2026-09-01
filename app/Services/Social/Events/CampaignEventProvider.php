<?php

namespace App\Services\Social\Events;

use App\Enums\EventType;

/**
 * Open fan tasks tagged as a campaign → `campaign`.
 *
 * Previously auto-generated off the active Season (a "view the loyalty
 * dashboard" card); now just another admin-authored Task, same as a
 * challenge, distinguished only by `feed_kind` — small external actions like
 * "join this ongoing competition" rather than a season-wide progress meter.
 */
class CampaignEventProvider extends TaskFeedProvider
{
    protected function feedKind(): string
    {
        return 'campaign';
    }

    protected function eventType(): EventType
    {
        return EventType::Campaign;
    }

    protected function ctaLabel(): string
    {
        return 'Join campaign';
    }
}
