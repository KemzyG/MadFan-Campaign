<?php

namespace App\Models;

use App\Support\PublicStorageUrl;
use Database\Factories\LeagueFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class League extends Model
{
    /** @use HasFactory<LeagueFactory> */
    use HasFactory;

    protected $fillable = [
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

    public function clubs(): HasMany
    {
        return $this->hasMany(Club::class);
    }

    public function getLogoUrlAttribute(): ?string
    {
        if (! $this->logo) {
            return null;
        }

        return PublicStorageUrl::path($this->logo);
    }
}
