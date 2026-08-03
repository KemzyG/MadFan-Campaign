<?php

namespace App\Models;

use Database\Factories\SeasonClaimHistoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeasonClaimHistory extends Model
{
    /** @use HasFactory<SeasonClaimHistoryFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'season_id',
        'week_number',
        'claim_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'claim_date' => 'date',
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
}
