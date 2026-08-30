<?php

namespace App\Services\Social\Events;

use App\Enums\EventPhase;
use App\Enums\EventType;
use App\Enums\StageStatus;
use App\Models\Stage;
use App\Models\User;
use App\Services\Social\StageService;
use App\Support\Social\EventCard;

/**
 * Live Stages → two event kinds, split on whether voice is up.
 *
 * A live public Stage with `voice_enabled` is someone broadcasting, so it reads
 * as a `livestream`; without voice it is a text watch-along gathering, i.e. a
 * `live_event`. Both reuse {@see StageService::presentStageCard()} for the
 * speaker-carousel payload — only the templates differ.
 */
class StageEventProvider implements EventProvider
{
    private const LIMIT = 8;

    public function __construct(private readonly StageService $stageService) {}

    public function cards(?User $viewer): iterable
    {
        $stages = Stage::query()
            ->where('status', StageStatus::Live)
            ->where('is_public', true)
            ->with('host:id,name,handle,username,fan_id,avatar_path,avatar_emoji,updated_at')
            ->latest('started_at')
            ->limit(self::LIMIT)
            ->get();

        foreach ($stages as $stage) {
            $type = $stage->voice_enabled ? EventType::Livestream : EventType::LiveEvent;
            $stageCard = $this->stageService->presentStageCard($stage);

            yield new EventCard(
                key: $type->value.':'.$stage->id,
                type: $type,
                phase: EventPhase::Live,
                timestamp: $stage->started_at ?? $stage->created_at,
                headline: $stage->title,
                subtitle: $stage->host ? 'Hosted by '.$stage->host->name : null,
                club: null,
                cta: ['label' => 'Join', 'href' => "/social/stage/{$stage->id}"],
                share: ['title' => $stage->title, 'url' => "/social/stage/{$stage->id}"],
                data: [
                    'stage' => $stageCard,
                    'description' => $stage->description,
                    'allow_chat' => (bool) $stage->allow_chat,
                    'allow_speak_requests' => (bool) $stage->allow_speak_requests,
                    'started_at' => $stage->started_at?->toIso8601String(),
                ],
            );
        }
    }
}
