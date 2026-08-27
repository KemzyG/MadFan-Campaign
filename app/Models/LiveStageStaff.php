<?php

namespace App\Models;

use App\Enums\LiveStageParticipantRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveStageStaff extends Model
{
    protected $fillable = [
        'live_stage_id',
        'user_id',
        'role',
        'granted_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => LiveStageParticipantRole::class,
            'granted_at' => 'datetime',
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
}
