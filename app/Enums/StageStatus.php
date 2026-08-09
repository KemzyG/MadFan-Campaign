<?php

namespace App\Enums;

enum StageStatus: string
{
    case Live = 'live';
    case Ended = 'ended';
}
