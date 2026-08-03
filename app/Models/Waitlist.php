<?php

namespace App\Models;

use Database\Factories\WaitlistFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Waitlist extends Model
{
    /** @use HasFactory<WaitlistFactory> */
    use HasFactory;

    protected $fillable = [
        'full_name',
        'email',
        'country',
        'league',
        'club',
        'source',
        'user_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
