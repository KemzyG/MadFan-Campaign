<?php

namespace App\Models;

use App\Support\PublicStorageUrl;
use Database\Factories\FandomFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fandom extends Model
{
    /** @use HasFactory<FandomFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'group',
        'icon',
        'cover_image',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'cover_image_url',
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

    public function subsets(): HasMany
    {
        return $this->hasMany(FandomSubset::class)->orderBy('sort_order');
    }

    /**
     * Null on purpose stays null here — cards render an icon-tinted
     * background instead of a broken/placeholder photo when there's no
     * real cover image, so callers must check for null rather than get a
     * default thumbnail back (contrast with League::getLogoUrlAttribute).
     */
    public function getCoverImageUrlAttribute(): ?string
    {
        return $this->cover_image !== null ? PublicStorageUrl::path($this->cover_image) : null;
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

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
