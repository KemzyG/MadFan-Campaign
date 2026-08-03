<?php

namespace App\Models;

use Database\Factories\UserReferralMilestoneFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserReferralMilestone extends Model
{
    /** @use HasFactory<UserReferralMilestoneFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'referral_milestone_id',
        'status',
        'progress_count',
        'completed_at',
        'point_transaction_id',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referralMilestone(): BelongsTo
    {
        return $this->belongsTo(ReferralMilestone::class);
    }

    public function pointTransaction(): BelongsTo
    {
        return $this->belongsTo(PointTransaction::class);
    }
}
