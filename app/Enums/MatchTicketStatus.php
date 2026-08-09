<?php

namespace App\Enums;

enum MatchTicketStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Used = 'used';
    case Cancelled = 'cancelled';
}
