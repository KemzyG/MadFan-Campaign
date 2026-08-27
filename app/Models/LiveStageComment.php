<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveStageComment extends Model
{
    protected $fillable = [
        'live_stage_id',
        'user_id',
        'body',
        'deleted_at',
        'deleted_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'deleted_at' => 'datetime',
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

    public function deletedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
