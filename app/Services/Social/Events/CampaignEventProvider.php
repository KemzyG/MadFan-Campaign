<?php

namespace App\Services\Social\Events;

use App\Enums\EventPhase;
use App\Enums\EventType;
use App\Models\Season;
use App\Models\User;
use App\Support\Social\EventCard;
use App\Support\Social\EventWindow;

/**
 * The active season → `campaign`.
 *
 * At most one campaign card: the running season, framed as the fan campaign
 * they can climb. Progress toward `ends_at` drives the template's meter.
 */
class CampaignEventProvider implements EventProvider
{
    public function cards(User $viewer): iterable
    {
        $season = Season::query()
            ->where('status', 'active')
            ->latest('starts_at')
            ->first();

        if ($season === null) {
            return;
        }

        $startsAt = $season->starts_at;
        $endsAt = $season->ends_at;
        $justStarted = $startsAt !== null && $startsAt->greaterThanOrEqualTo(EventWindow::recentSince());

        $progress = null;
        if ($startsAt !== null && $endsAt !== null && $endsAt->greaterThan($startsAt)) {
            $elapsed = $startsAt->diffInSeconds(now());
            $total = $startsAt->diffInSeconds($endsAt);
            $progress = (int) max(0, min(100, round($elapsed / max(1, $total) * 100)));
        }

        $currentWeek = $season->seasonWeeks()
            ->where('is_active', true)
            ->orderBy('week_number')
            ->value('week_number');

        yield new EventCard(
            key: EventType::Campaign->value.':'.$season->id,
            type: EventType::Campaign,
            phase: $justStarted ? EventPhase::Recent : EventPhase::Live,
            timestamp: $justStarted ? $startsAt : ($endsAt ?? $startsAt),
            headline: $season->name,
            subtitle: $endsAt ? 'Runs until '.$endsAt->isoFormat('MMM D') : null,
            club: null,
            cta: ['label' => 'View campaign', 'href' => '/campaign'],
            share: ['title' => $season->name, 'url' => '/campaign'],
            data: [
                'starts_at' => $startsAt?->toIso8601String(),
                'ends_at' => $endsAt?->toIso8601String(),
                'total_weeks' => $season->total_weeks,
                'current_week' => $currentWeek !== null ? (int) $currentWeek : null,
                'progress' => $progress,
                // Carbon 3 returns a float here — round up so a part-day still reads as a day.
                'days_left' => $endsAt && $endsAt->isFuture() ? (int) ceil(now()->diffInDays($endsAt)) : null,
            ],
        );
    }
}
