<?php

namespace App\Models;

use Database\Factories\StreakMilestoneFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StreakMilestone extends Model
{
    /** @use HasFactory<StreakMilestoneFactory> */
    use HasFactory;

    protected $fillable = [
        'season_id',
        'day_count',
        'name',
        'bonus_points',
        'multiplier',
        'description',
    ];

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }
}
