<?php

namespace App\Enums;

enum StageType: string
{
    case Voice = 'voice';
    case Video = 'video';
    case Streaming = 'streaming';
}
