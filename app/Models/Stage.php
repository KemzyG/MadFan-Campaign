<?php

namespace App\Models;

use App\Enums\StageStatus;
use Database\Factories\StageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stage extends Model
{
    /** @use HasFactory<StageFactory> */
    use HasFactory;

    protected $fillable = [
        'host_id',
        'club_id',
        'title',
        'description',
        'is_public',
        'allow_invite',
        'allow_chat',
        'allow_speak_requests',
        'background_key',
        'status',
        'voice_enabled',
        'started_at',
        'ended_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => StageStatus::class,
            'is_public' => 'boolean',
            'allow_invite' => 'boolean',
            'allow_chat' => 'boolean',
            'allow_speak_requests' => 'boolean',
            'background_key' => 'integer',
            'voice_enabled' => 'boolean',
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

    public function participants(): HasMany
    {
        return $this->hasMany(StageParticipant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(StageMessage::class);
    }

    public function signals(): HasMany
    {
        return $this->hasMany(StageSignal::class);
    }

    public function isLive(): bool
    {
        return $this->status === StageStatus::Live;
    }
}
