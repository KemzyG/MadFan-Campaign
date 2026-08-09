<?php

namespace App\Enums;

enum SocialReportStatus: string
{
    case Open = 'open';
    case Reviewing = 'reviewing';
    case Resolved = 'resolved';
    case Dismissed = 'dismissed';
}
