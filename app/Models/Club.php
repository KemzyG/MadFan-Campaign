<?php

namespace App\Models;

use App\Support\PublicStorageUrl;
use Database\Factories\ClubFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Club extends Model
{
    /** @use HasFactory<ClubFactory> */
    use HasFactory;

    protected $fillable = [
        'league_id',
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

    public function league(): BelongsTo
    {
        return $this->belongsTo(League::class);
    }

    public function clubServer(): HasOne
    {
        return $this->hasOne(ClubServer::class);
    }

    public function jerseys(): HasMany
    {
        return $this->hasMany(Jersey::class);
    }

    public function getLogoUrlAttribute(): ?string
    {
        if (! $this->logo) {
            return null;
        }

        return PublicStorageUrl::path($this->logo);
    }
}
