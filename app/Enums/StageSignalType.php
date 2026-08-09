<?php

namespace App\Enums;

enum StageSignalType: string
{
    case Offer = 'offer';
    case Answer = 'answer';
    case Ice = 'ice';
}
