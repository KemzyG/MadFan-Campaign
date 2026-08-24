<?php

namespace App\Enums;

enum PostVisibility: string
{
    case Public = 'public';
    case Club = 'club';
    case OnlyMe = 'only_me';
}
