<?php

namespace App\Models;

use Database\Factories\PointTransactionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PointTransaction extends Model
{
    /** @use HasFactory<PointTransactionFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'season_id',
        'source_type',
        'source_id',
        'amount',
        'balance_after',
        'reason',
        'metadata',
        'idempotency_key',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
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

    public function userTaskProgresses(): HasMany
    {
        return $this->hasMany(UserTaskProgress::class, 'point_transaction_id');
    }

    public function dailyClaims(): HasMany
    {
        return $this->hasMany(DailyClaim::class, 'point_transaction_id');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class, 'point_transaction_id');
    }

    public function userReferralMilestones(): HasMany
    {
        return $this->hasMany(UserReferralMilestone::class, 'point_transaction_id');
    }

    public function weeklyProgresses(): HasMany
    {
        return $this->hasMany(WeeklyProgress::class, 'completion_bonus_transaction_id');
    }
}
