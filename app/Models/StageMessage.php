<?php

namespace App\Models;

use Database\Factories\StageMessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StageMessage extends Model
{
    /** @use HasFactory<StageMessageFactory> */
    use HasFactory;

    protected $fillable = [
        'stage_id',
        'user_id',
        'body',
    ];

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
