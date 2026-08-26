<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per user per calendar day they claimed the daily-tasks reward.
 * The unique (user_id, claim_date) index is the actual double-claim guard;
 * SocialDailyTaskService checks completion state before ever inserting one.
 */
class SocialDailyTaskClaim extends Model
{
    protected $fillable = [
        'user_id',
        'claim_date',
        'week_index',
        'points_awarded',
        'point_transaction_id',
        'claimed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'claim_date' => 'date',
            'week_index' => 'integer',
            'points_awarded' => 'integer',
            'claimed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pointTransaction(): BelongsTo
    {
        return $this->belongsTo(PointTransaction::class);
    }
}
