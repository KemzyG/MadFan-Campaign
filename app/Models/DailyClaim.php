<?php

namespace App\Models;

use Database\Factories\DailyClaimFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyClaim extends Model
{
    /** @use HasFactory<DailyClaimFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'season_id',
        'claim_date',
        'status',
        'base_points',
        'multiplier',
        'points_earned',
        'streak_day_number',
        'claimed_at',
        'point_transaction_id',
    ];

    protected function casts(): array
    {
        return [
            'claim_date' => 'date',
            'claimed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function pointTransaction(): BelongsTo
    {
        return $this->belongsTo(PointTransaction::class);
    }
}
