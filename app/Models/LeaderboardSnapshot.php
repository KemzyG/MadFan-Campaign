<?php

namespace App\Models;

use Database\Factories\LeaderboardSnapshotFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaderboardSnapshot extends Model
{
    /** @use HasFactory<LeaderboardSnapshotFactory> */
    use HasFactory;

    protected $fillable = [
        'season_id',
        'snapshot_at',
        'scope',
        'scope_value',
    ];

    protected function casts(): array
    {
        return [
            'snapshot_at' => 'datetime',
        ];
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function leaderboardEntries(): HasMany
    {
        return $this->hasMany(LeaderboardEntry::class);
    }
}
