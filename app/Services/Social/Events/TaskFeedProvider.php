<?php

namespace App\Services\Social\Events;

use App\Enums\EventPhase;
use App\Enums\EventType;
use App\Models\Task;
use App\Models\User;
use App\Support\CampaignRouting;
use App\Support\Social\EventCard;
use App\Support\Social\EventWindow;
use Illuminate\Database\Eloquent\Builder;

/**
 * Shared machinery for the two Task-backed feed kinds — `fan_challenge` and
 * `campaign` — which differ only in which tasks they pick up (`feed_kind`)
 * and their card's type/CTA copy. Both are admin-authored `Task` rows; a
 * task is on the feed while its window is open, and from the moment it is
 * announced if it starts inside the upcoming window. Staff-audience tasks
 * never surface here.
 */
abstract class TaskFeedProvider implements EventProvider
{
    private const LIMIT = 6;

    abstract protected function feedKind(): string;

    abstract protected function eventType(): EventType;

    abstract protected function ctaLabel(): string;

    public function cards(?User $viewer): iterable
    {
        $tasks = Task::query()
            ->forFans()
            ->where('is_active', true)
            ->where('feed_kind', $this->feedKind())
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
            $type = $this->eventType();
            // Absolute — /tasks lives on the campaign/fan surface, which can
            // be a different domain than wherever this feed is served.
            $href = CampaignRouting::url('/tasks/'.$task->id);

            yield new EventCard(
                key: $type->value.':'.$task->id,
                type: $type,
                phase: $notStarted ? EventPhase::Upcoming : EventPhase::Live,
                timestamp: $notStarted ? $task->starts_at : ($task->ends_at ?? $task->starts_at ?? $task->created_at),
                headline: $task->name,
                subtitle: $task->description,
                club: null,
                // The task's own page (not the /tasks list): still renders
                // external_url as its own "Open task" step link (new tab) and
                // lets the fan confirm/claim right there. See Fan/TaskShow.jsx.
                cta: ['label' => $this->ctaLabel(), 'href' => $href],
                share: ['title' => $task->name, 'url' => $href],
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
