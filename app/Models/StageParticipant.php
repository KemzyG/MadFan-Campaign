<?php

namespace App\Models;

use App\Enums\StageParticipantRole;
use Database\Factories\StageParticipantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StageParticipant extends Model
{
    /** @use HasFactory<StageParticipantFactory> */
    use HasFactory;

    protected $fillable = [
        'stage_id',
        'user_id',
        'role',
        'is_muted',
        'speak_requested_at',
        'joined_at',
        'left_at',
        'last_seen_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => StageParticipantRole::class,
            'is_muted' => 'boolean',
            'speak_requested_at' => 'datetime',
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isOnStage(): bool
    {
        return in_array($this->role, [StageParticipantRole::Host, StageParticipantRole::Speaker], true);
    }

    public function isActive(): bool
    {
        return $this->left_at === null;
    }
}
