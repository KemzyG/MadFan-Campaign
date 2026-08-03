<?php

namespace App\Models;

use Database\Factories\LeaderboardEntryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaderboardEntry extends Model
{
    /** @use HasFactory<LeaderboardEntryFactory> */
    use HasFactory;

    protected $fillable = [
        'leaderboard_snapshot_id',
        'user_id',
        'rank',
        'points',
        'loyalty_tier_id',
    ];

    public function leaderboardSnapshot(): BelongsTo
    {
        return $this->belongsTo(LeaderboardSnapshot::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function loyaltyTier(): BelongsTo
    {
        return $this->belongsTo(LoyaltyTier::class);
    }
}
