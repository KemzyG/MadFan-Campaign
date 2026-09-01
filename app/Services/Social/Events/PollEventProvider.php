<?php

namespace App\Services\Social\Events;

use App\Enums\EventPhase;
use App\Enums\EventType;
use App\Models\Poll;
use App\Models\User;
use App\Services\Social\PollService;
use App\Support\Social\EventCard;

/**
 * Open fan votes → `vote`. Platform-wide polls (no fandom_id) show for every
 * viewer; fandom-scoped polls only show to fans of that fandom.
 */
class PollEventProvider implements EventProvider
{
    private const LIMIT = 6;

    public function __construct(private PollService $polls) {}

    public function cards(?User $viewer): iterable
    {
        $polls = Poll::query()
            ->open()
            ->where(function ($query) use ($viewer): void {
                $query->whereNull('fandom_id');

                if ($viewer?->favourite_fandom_id) {
                    $query->orWhere('fandom_id', $viewer->favourite_fandom_id);
                }
            })
            ->latest('id')
            ->limit(self::LIMIT)
            ->get();

        foreach ($polls as $poll) {
            yield $this->card($poll, $viewer);
        }
    }

    private function card(Poll $poll, ?User $viewer): EventCard
    {
        $presented = $this->polls->present($poll, $viewer);

        return new EventCard(
            key: EventType::Vote->value.':'.$poll->id,
            type: EventType::Vote,
            phase: EventPhase::Live,
            timestamp: $poll->created_at,
            headline: $poll->question,
            subtitle: $presented['total_votes'].' '.str('vote')->plural($presented['total_votes']).' so far',
            club: null,
            cta: ['label' => 'Vote now', 'href' => "/social/polls/{$poll->id}"],
            share: ['title' => $poll->question, 'url' => "/social/polls/{$poll->id}"],
            data: [
                'options' => $presented['options'],
                'total_votes' => $presented['total_votes'],
                'my_option_id' => $presented['my_option_id'],
                'closes_at' => $presented['closes_at'],
            ],
        );
    }
}
