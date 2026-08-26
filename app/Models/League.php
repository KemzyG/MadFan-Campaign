<?php

namespace App\Models;

use App\Support\PublicStorageUrl;
use Database\Factories\LeagueFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class League extends Model
{
    /** @use HasFactory<LeagueFactory> */
    use HasFactory;

    protected $fillable = [
        'fandom_id',
        'name',
        'short',
        'logo',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'logo_url',
    ];

    public function fandom(): BelongsTo
    {
        return $this->belongsTo(Fandom::class);
    }

    public function clubs(): HasMany
    {
        return $this->hasMany(Club::class);
    }

    public function standings(): HasMany
    {
        return $this->hasMany(LeagueStanding::class);
    }

    public function getLogoUrlAttribute(): string
    {
        return PublicStorageUrl::path($this->logo);
    }
}
