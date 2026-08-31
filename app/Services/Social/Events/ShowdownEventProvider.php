<?php

namespace App\Services\Social\Events;

use App\Enums\EventPhase;
use App\Enums\EventType;
use App\Models\Showdown;
use App\Models\User;
use App\Services\Social\ShowdownService;
use App\Support\Social\EventCard;

/**
 * Open fan showdowns → `showdown`. Reads as "live" the whole time it's open
 * (there's no kickoff/closing countdown most showdowns bother with) — the
 * card teases the tally and links straight into the full vote page.
 */
class ShowdownEventProvider implements EventProvider
{
    private const LIMIT = 6;

    public function __construct(private ShowdownService $showdowns) {}

    public function cards(?User $viewer): iterable
    {
        foreach ($this->showdowns->openForFeed(self::LIMIT) as $showdown) {
            yield $this->card($showdown, $viewer);
        }
    }

    private function card(Showdown $showdown, ?User $viewer): EventCard
    {
        $presented = $this->showdowns->present($showdown, $viewer);
        $a = $presented['contestant_a'];
        $b = $presented['contestant_b'];

        return new EventCard(
            key: EventType::Showdown->value.':'.$showdown->id,
            type: EventType::Showdown,
            phase: EventPhase::Live,
            timestamp: $showdown->created_at,
            headline: $showdown->title,
            subtitle: sprintf('%s vs %s', $a['name'] ?? 'Fan A', $b['name'] ?? 'Fan B'),
            club: null,
            cta: ['label' => 'Vote now', 'href' => "/social/showdown/{$showdown->id}"],
            share: ['title' => $showdown->title, 'url' => "/social/showdown/{$showdown->id}"],
            data: [
                'contestant_a' => $a,
                'contestant_b' => $b,
                'total_votes' => $presented['total_votes'],
                'my_side' => $presented['my_side'],
            ],
        );
    }
}
