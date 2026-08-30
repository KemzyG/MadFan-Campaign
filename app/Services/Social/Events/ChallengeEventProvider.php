<?php

namespace App\Services\Social\Events;

use App\Enums\EventPhase;
use App\Enums\EventType;
use App\Models\Task;
use App\Models\User;
use App\Support\Social\EventCard;
use App\Support\Social\EventWindow;
use Illuminate\Database\Eloquent\Builder;

/**
 * Open fan tasks → `fan_challenge`.
 *
 * A challenge is on the feed while its window is open, and from the moment it
 * is announced if it starts inside the upcoming window. Staff-audience tasks
 * never surface here.
 */
class ChallengeEventProvider implements EventProvider
{
    private const LIMIT = 6;

    public function cards(?User $viewer): iterable
    {
        $tasks = Task::query()
            ->forFans()
            ->where('is_active', true)
            ->where(function (Builder $query): void {
                // Open right now …
                $query->where(function (Builder $open): void {
                    $open->where(function (Builder $started): void {
                        $started->whereNull('starts_at')->orWhere('starts_at', '<=', now());
                    })->where(function (Builder $unfinished): void {
                        $unfinished->whereNull('ends_at')->orWhere('ends_at', '>=', now());
                    });
                })
                    // … or announced and starting soon.
                    ->orWhereBetween('starts_at', [now(), EventWindow::upcomingUntil()]);
            })
            ->orderByRaw('COALESCE(ends_at, starts_at) IS NULL')
            ->orderByRaw('COALESCE(ends_at, starts_at)')
            ->orderBy('display_order')
            ->limit(self::LIMIT)
            ->get();

        foreach ($tasks as $task) {
            $notStarted = $task->starts_at !== null && $task->starts_at->isFuture();

            yield new EventCard(
                key: EventType::FanChallenge->value.':'.$task->id,
                type: EventType::FanChallenge,
                phase: $notStarted ? EventPhase::Upcoming : EventPhase::Live,
                timestamp: $notStarted ? $task->starts_at : ($task->ends_at ?? $task->starts_at ?? $task->created_at),
                headline: $task->name,
                subtitle: $task->description,
                club: null,
                cta: [
                    'label' => 'Join challenge',
                    'href' => filled($task->external_url) ? $task->external_url : '/campaign',
                ],
                share: ['title' => $task->name, 'url' => '/campaign'],
                data: [
                    'points' => (int) $task->points,
                    'platform' => $task->platform,
                    'task_type' => $task->task_type,
                    'starts_at' => $task->starts_at?->toIso8601String(),
                    'ends_at' => $task->ends_at?->toIso8601String(),
                    'verification_required' => (bool) $task->verification_required,
                    'is_external' => filled($task->external_url),
                ],
            );
        }
    }
}
