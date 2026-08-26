<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FandomFollow extends Model
{
    protected $fillable = [
        'user_id',
        'fandom_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fandom(): BelongsTo
    {
        return $this->belongsTo(Fandom::class);
    }
}
