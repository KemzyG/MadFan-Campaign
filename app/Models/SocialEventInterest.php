<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A viewer's "interested" mark on an events-feed card.
 *
 * Events are projected from many different models, so this points at the
 * provider-minted event key (`live_match:12`) instead of a foreign key.
 */
class SocialEventInterest extends Model
{
    protected $fillable = [
        'user_id',
        'event_key',
        'event_type',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
