<?php

namespace App\Enums;

/**
 * Where an event sits relative to now. Drives the card's status pill and the
 * top-level ordering of the events feed: live first, then what's about to
 * start, then what just landed.
 */
enum EventPhase: string
{
    case Live = 'live';
    case Upcoming = 'upcoming';
    case Recent = 'recent';

    /** Sort weight — lower floats to the top of the feed. */
    public function weight(): int
    {
        return match ($this) {
            self::Live => 0,
            self::Upcoming => 1,
            self::Recent => 2,
        };
    }

    /** Text inside the status pill. */
    public function pill(): string
    {
        return match ($this) {
            self::Live => 'LIVE',
            self::Upcoming => 'SOON',
            self::Recent => 'NEW',
        };
    }

    /**
     * Upcoming events read best soonest-first; live and recent read
     * newest-first. Used to flip the timestamp comparator per phase.
     */
    public function sortsAscending(): bool
    {
        return $this === self::Upcoming;
    }
}
