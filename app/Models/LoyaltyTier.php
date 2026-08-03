<?php

namespace App\Models;

use Database\Factories\LoyaltyTierFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyTier extends Model
{
    /** @use HasFactory<LoyaltyTierFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'min_points',
        'max_points',
        'display_order',
    ];

    public function tierRewards(): HasMany
    {
        return $this->hasMany(TierReward::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function leaderboardEntries(): HasMany
    {
        return $this->hasMany(LeaderboardEntry::class);
    }

    /**
     * Resolve the tier earned for a given points balance.
     */
    public static function forPoints(int $points): ?self
    {
        return static::query()
            ->where('min_points', '<=', $points)
            ->orderByDesc('min_points')
            ->first();
    }

    /**
     * Next tier after this one by display order, if any.
     */
    public function nextTier(): ?self
    {
        return static::query()
            ->where('display_order', '>', $this->display_order)
            ->orderBy('display_order')
            ->first();
    }
}
