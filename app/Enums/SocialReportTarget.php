<?php

namespace App\Enums;

enum SocialReportTarget: string
{
    case Post = 'post';
    case Message = 'message';
    case User = 'user';
}
