<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShowdownVote extends Model
{
    protected $fillable = [
        'showdown_id',
        'user_id',
        'side',
        'tap_count',
        'points_awarded',
    ];

    protected function casts(): array
    {
        return [
            'tap_count' => 'integer',
            'points_awarded' => 'integer',
        ];
    }

    public function showdown(): BelongsTo
    {
        return $this->belongsTo(Showdown::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
