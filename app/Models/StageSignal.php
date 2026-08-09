<?php

namespace App\Models;

use App\Enums\StageSignalType;
use Database\Factories\StageSignalFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StageSignal extends Model
{
    /** @use HasFactory<StageSignalFactory> */
    use HasFactory;

    protected $fillable = [
        'stage_id',
        'from_user_id',
        'to_user_id',
        'type',
        'payload',
        'consumed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => StageSignalType::class,
            'payload' => 'array',
            'consumed_at' => 'datetime',
        ];
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }
}
