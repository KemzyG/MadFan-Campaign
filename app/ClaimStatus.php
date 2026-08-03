<?php

namespace App;

enum ClaimStatus: string
{
    case Claimed = 'claimed';
    case Missed = 'missed';
    case Upcoming = 'upcoming';
}
