<?php

namespace App\Models;

use Database\Factories\ReferralFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Referral extends Model
{
    /** @use HasFactory<ReferralFactory> */
    use HasFactory;

    protected $fillable = [
        'referrer_user_id',
        'referred_user_id',
        'referred_email',
        'referred_user_handle',
        'referral_code',
        'status',
        'points_awarded',
        'point_transaction_id',
        'activated_at',
        'rewarded_at',
    ];

    protected function casts(): array
    {
        return [
            'activated_at' => 'datetime',
            'rewarded_at' => 'datetime',
        ];
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function referred(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }

    public function pointTransaction(): BelongsTo
    {
        return $this->belongsTo(PointTransaction::class);
    }
}
