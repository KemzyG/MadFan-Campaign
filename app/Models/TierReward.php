<?php

namespace App\Models;

use Database\Factories\TierRewardFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TierReward extends Model
{
    /** @use HasFactory<TierRewardFactory> */
    use HasFactory;

    protected $fillable = [
        'loyalty_tier_id',
        'reward_text',
        'display_order',
    ];

    public function loyaltyTier(): BelongsTo
    {
        return $this->belongsTo(LoyaltyTier::class);
    }
}
