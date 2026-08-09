<?php

namespace App\Enums;

enum PostType: string
{
    case Status = 'status';
    case Repost = 'repost';
    case Quote = 'quote';
}
