<?php

namespace App\Services\Social\Events;

use App\Enums\EventType;

/** Open fan tasks tagged as a challenge → `fan_challenge`. */
class ChallengeEventProvider extends TaskFeedProvider
{
    protected function feedKind(): string
    {
        return 'challenge';
    }

    protected function eventType(): EventType
    {
        return EventType::FanChallenge;
    }

    protected function ctaLabel(): string
    {
        return 'Join challenge';
    }
}
