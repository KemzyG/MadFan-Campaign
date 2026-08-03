<?php

namespace App;

enum ReferralStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Rejected = 'rejected';
    case Rewarded = 'rewarded';
}
