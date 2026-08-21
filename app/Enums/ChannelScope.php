<?php

namespace App\Enums;

enum ChannelScope: string
{
    case Club = 'club';
    case Direct = 'direct';
    case Group = 'group';
}
