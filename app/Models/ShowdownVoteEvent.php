<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShowdownVoteEvent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'showdown_id',
        'user_id',
        'side',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
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
