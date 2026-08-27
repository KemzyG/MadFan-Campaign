<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveStageReactionTotal extends Model
{
    protected $fillable = [
        'live_stage_id',
        'emoji',
        'total',
    ];

    public function liveStage(): BelongsTo
    {
        return $this->belongsTo(LiveStage::class);
    }
}
