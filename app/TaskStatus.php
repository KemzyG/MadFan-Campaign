<?php

namespace App;

enum TaskStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Claimed = 'claimed';
    case Failed = 'failed';
    case Rejected = 'rejected';
}
