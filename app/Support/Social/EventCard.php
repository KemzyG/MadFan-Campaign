<?php

namespace App\Support\Social;

use App\Enums\EventPhase;
use App\Enums\EventType;
use App\Services\Social\EventFeedService;
use Carbon\CarbonInterface;

/**
 * One card on the Social events feed, normalised across its eight source
 * models. Providers mint these; {@see EventFeedService}
 * merges, sorts, decorates with interest, and hands them to Inertia.
 *
 * `data` is the type-specific payload — only the matching React template reads
 * it, so its shape is owned by each provider/template pair, not this DTO.
 */
final class EventCard
{
    /**
     * @param  array<string, mixed>  $club
     * @param  array{label: string, href: string}|null  $cta
     * @param  array{title: string, url: string}|null  $share
     * @param  array<string, mixed>  $data
     */
    public function __construct(
        public readonly string $key,
        public readonly EventType $type,
        public readonly EventPhase $phase,
        public readonly ?CarbonInterface $timestamp,
        public readonly string $headline,
        public readonly ?string $subtitle = null,
        public readonly ?array $club = null,
        public readonly ?array $cta = null,
        public readonly ?array $share = null,
        public readonly array $data = [],
        public readonly bool $isPinned = false,
        public readonly int $interestCount = 0,
        public readonly bool $interested = false,
    ) {}

    /** Copy with interest state resolved for a given viewer. */
    public function withInterest(int $count, bool $interested): self
    {
        return new self(
            key: $this->key,
            type: $this->type,
            phase: $this->phase,
            timestamp: $this->timestamp,
            headline: $this->headline,
            subtitle: $this->subtitle,
            club: $this->club,
            cta: $this->cta,
            share: $this->share,
            data: $this->data,
            isPinned: $this->isPinned,
            interestCount: $count,
            interested: $interested,
        );
    }

    /** Unix seconds of the sort anchor, or 0 when timeless. */
    public function sortTime(): int
    {
        return $this->timestamp?->getTimestamp() ?? 0;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'type' => $this->type->value,
            'label' => $this->type->label(),
            'phase' => $this->phase->value,
            'pill' => $this->phase->pill(),
            'timestamp' => $this->timestamp?->toIso8601String(),
            'headline' => $this->headline,
            'subtitle' => $this->subtitle,
            'club' => $this->club,
            'cta' => $this->cta,
            'share' => $this->share,
            'data' => $this->data,
            'is_pinned' => $this->isPinned,
            'interest' => [
                'count' => $this->interestCount,
                'active' => $this->interested,
            ],
        ];
    }
}
