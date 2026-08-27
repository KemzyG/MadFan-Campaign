<?php

namespace App\Enums;

/**
 * Staff roles on a live stage. Viewers are NOT a case here — they're tracked
 * via LiveStageViewerSession, not a role row, since every authenticated fan
 * can watch without any elevated grant. Host/CoHost/Moderator are the only
 * roles that need an explicit, revocable grant (see LiveStageStaff).
 */
enum LiveStageParticipantRole: string
{
    case Host = 'host';
    case CoHost = 'co_host';
    case Moderator = 'moderator';
}
