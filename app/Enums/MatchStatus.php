<?php

namespace App\Enums;

enum MatchStatus: string
{
    case Upcoming = 'upcoming';
    case Live = 'live';
    case Finished = 'finished';
}
