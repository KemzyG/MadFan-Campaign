<?php

namespace App\Enums;

enum ReplyScope: string
{
    case Everyone = 'everyone';
    case Following = 'following';
    case Tagged = 'tagged';
}
