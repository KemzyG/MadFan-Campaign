<?php

namespace App\Enums;

/**
 * Backend-authoritative lifecycle. A row existing does not mean the stage is
 * live — `status` is the single source of truth every read/write checks.
 *
 *   draft → scheduled (optional) → starting → live → ending → ended
 *                                                            ↘ cancelled (from draft/scheduled only)
 */
enum LiveStageStatus: string
{
    case Draft = 'draft';
    case Scheduled = 'scheduled';
    case Starting = 'starting';
    case Live = 'live';
    case Ending = 'ending';
    case Ended = 'ended';
    case Cancelled = 'cancelled';

    public function isTerminal(): bool
    {
        return $this === self::Ended || $this === self::Cancelled;
    }
}
