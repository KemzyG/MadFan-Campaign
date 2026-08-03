<?php

namespace App\Models;

use Database\Factories\AdminOrganizationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

#[Fillable([
    'name',
    'slug',
    'description',
    'partition_countries',
    'partition_leagues',
    'partition_clubs',
    'is_active',
])]
class AdminOrganization extends Model
{
    /** @use HasFactory<AdminOrganizationFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (AdminOrganization $organization): void {
            if (blank($organization->slug) && filled($organization->name)) {
                $organization->slug = Str::slug($organization->name);
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'partition_countries' => 'array',
            'partition_leagues' => 'array',
            'partition_clubs' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'admin_organization_user')
            ->withTimestamps();
    }

    public function hasActivePartitions(): bool
    {
        return filled($this->partition_countries)
            || filled($this->partition_leagues)
            || filled($this->partition_clubs);
    }
}
