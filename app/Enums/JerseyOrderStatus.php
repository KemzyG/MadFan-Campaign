<?php

namespace App\Enums;

enum JerseyOrderStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Fulfilled = 'fulfilled';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return str($this->value)->title()->toString();
    }
}
