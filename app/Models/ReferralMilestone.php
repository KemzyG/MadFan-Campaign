<?php

namespace App\Models;

use Database\Factories\ReferralMilestoneFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReferralMilestone extends Model
{
    /** @use HasFactory<ReferralMilestoneFactory> */
    use HasFactory;

    protected $fillable = [
        'season_id',
        'target_count',
        'reward_name',
        'reward_description',
        'bonus_points',
        'display_order',
    ];

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function userReferralMilestones(): HasMany
    {
        return $this->hasMany(UserReferralMilestone::class);
    }
}
