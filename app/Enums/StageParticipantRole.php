<?php

namespace App\Enums;

enum StageParticipantRole: string
{
    case Host = 'host';
    case Speaker = 'speaker';
    case Listener = 'listener';
}
