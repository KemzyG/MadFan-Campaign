<?php

namespace App\Models;

use Database\Factories\ClubServerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClubServer extends Model
{
    /** @use HasFactory<ClubServerFactory> */
    use HasFactory;

    protected $fillable = [
        'club_id',
        'name',
    ];

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function channels(): HasMany
    {
        return $this->hasMany(Channel::class)->orderBy('position')->orderBy('id');
    }
}
