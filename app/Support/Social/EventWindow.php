<?php

namespace App\Support\Social;

use Illuminate\Support\Carbon;

/**
 * Shared time bounds for the Social events feed, so every provider agrees on
 * how far back "just happened" reaches and how far ahead "about to start" runs.
 */
final class EventWindow
{
    /** How long a just-published item keeps its place on the NOW feed. */
    public const RECENT_DAYS = 7;

    /** How far ahead a scheduled item is worth surfacing. */
    public const UPCOMING_DAYS = 14;

    public static function recentSince(): Carbon
    {
        return now()->subDays(self::RECENT_DAYS);
    }

    public static function upcomingUntil(): Carbon
    {
        return now()->addDays(self::UPCOMING_DAYS);
    }
}
