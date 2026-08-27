<?php

namespace App\Enums;

/**
 * Audit trail of moderation actions on a live stage (see LiveStageModerationLog).
 * Every action a host/moderator can take against a viewer or a comment is
 * logged here — never silently applied — so abuse and disputes are reviewable.
 */
enum LiveStageModerationAction: string
{
    case ViewerMuted = 'viewer_muted';
    case ViewerUnmuted = 'viewer_unmuted';
    case ViewerRemoved = 'viewer_removed';
    case ViewerBanned = 'viewer_banned';
    case ViewerUnbanned = 'viewer_unbanned';
    case CommentDeleted = 'comment_deleted';
}
