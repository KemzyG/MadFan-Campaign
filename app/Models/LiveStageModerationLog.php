<?php

namespace App\Models;

use App\Enums\LiveStageModerationAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveStageModerationLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'live_stage_id',
        'actor_id',
        'target_user_id',
        'action',
        'reason',
        'context',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'action' => LiveStageModerationAction::class,
            'context' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function liveStage(): BelongsTo
    {
        return $this->belongsTo(LiveStage::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function target(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }
}
