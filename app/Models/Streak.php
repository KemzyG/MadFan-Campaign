<?php

namespace App\Models;

use Database\Factories\StreakFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Streak extends Model
{
    /** @use HasFactory<StreakFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'current_streak_days',
        'best_streak_days',
        'last_claimed_at',
        'next_claim_reset_at',
        'current_multiplier',
        'current_milestone_label',
    ];

    protected function casts(): array
    {
        return [
            'last_claimed_at' => 'datetime',
            'next_claim_reset_at' => 'datetime',
            'current_multiplier' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
