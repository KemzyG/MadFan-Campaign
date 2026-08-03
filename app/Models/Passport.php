<?php

namespace App\Models;

use Database\Factories\PassportFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Passport extends Model
{
    /** @use HasFactory<PassportFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'season_id',
        'qr_value',
        'referral_link',
        'share_slug',
        'is_public',
        'last_shared_at',
        'snapshot_name',
        'snapshot_handle',
        'snapshot_club',
        'snapshot_tier',
        'snapshot_points',
        'snapshot_streak_days',
        'snapshot_referral_count',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }
}
