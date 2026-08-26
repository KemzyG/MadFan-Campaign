<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fandom extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function leagues(): HasMany
    {
        return $this->hasMany(League::class, 'fandom_id');
    }

    public function follows(): HasMany
    {
        return $this->hasMany(FandomFollow::class);
    }

    public function predictions(): HasMany
    {
        return $this->hasMany(Prediction::class);
    }

    public function polls(): HasMany
    {
        return $this->hasMany(Poll::class);
    }
}
