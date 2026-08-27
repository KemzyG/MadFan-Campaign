<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveStageViewerSession extends Model
{
    protected $fillable = [
        'live_stage_id',
        'user_id',
        'joined_at',
        'last_seen_at',
        'left_at',
        'banned_at',
        'is_muted_by_host',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'left_at' => 'datetime',
            'banned_at' => 'datetime',
            'is_muted_by_host' => 'boolean',
        ];
    }

    public function liveStage(): BelongsTo
    {
        return $this->belongsTo(LiveStage::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->left_at === null;
    }
}
