<?php

namespace App\Models;

use App\Enums\LiveStageStatus;
use App\Enums\LiveStageType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LiveStage extends Model
{
    protected $fillable = [
        'host_id',
        'club_id',
        'type',
        'title',
        'description',
        'cover_image_path',
        'is_public',
        'status',
        'stream_provider',
        'stream_room_id',
        'settings',
        'scheduled_at',
        'started_at',
        'ended_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => LiveStageType::class,
            'status' => LiveStageStatus::class,
            'is_public' => 'boolean',
            'settings' => 'array',
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function staff(): HasMany
    {
        return $this->hasMany(LiveStageStaff::class);
    }

    public function viewerSessions(): HasMany
    {
        return $this->hasMany(LiveStageViewerSession::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(LiveStageComment::class);
    }

    public function reactionTotals(): HasMany
    {
        return $this->hasMany(LiveStageReactionTotal::class);
    }

    public function moderationLogs(): HasMany
    {
        return $this->hasMany(LiveStageModerationLog::class);
    }

    public function isLive(): bool
    {
        return $this->status === LiveStageStatus::Live;
    }

    public function isHost(User $user): bool
    {
        return (int) $this->host_id === (int) $user->id;
    }
}
