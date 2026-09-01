<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The fandom equivalent of ClubServer — see that model's own channels()
 * relation for the shape this mirrors exactly.
 */
class FandomServer extends Model
{
    protected $fillable = [
        'fandom_id',
        'name',
    ];

    public function fandom(): BelongsTo
    {
        return $this->belongsTo(Fandom::class);
    }

    public function channels(): HasMany
    {
        return $this->hasMany(Channel::class)->orderBy('position')->orderBy('id');
    }
}
