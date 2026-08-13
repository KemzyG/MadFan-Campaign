<?php

namespace App\Models;

use App\Support\PublicStorageUrl;
use Database\Factories\JerseyFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Jersey extends Model
{
    /** @use HasFactory<JerseyFactory> */
    use HasFactory;

    protected $fillable = [
        'club_id',
        'name',
        'slug',
        'description',
        'image',
        'price',
        'is_active',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'image_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Jersey $jersey): void {
            if (blank($jersey->slug)) {
                $jersey->slug = static::uniqueSlugFor($jersey->name);
            }
        });
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(JerseyVariant::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(JerseyOrderItem::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        return PublicStorageUrl::path($this->image);
    }

    public function totalStock(): int
    {
        if ($this->relationLoaded('variants')) {
            return (int) $this->variants->sum('stock');
        }

        return (int) $this->variants()->sum('stock');
    }

    public function isPurchasable(): bool
    {
        return $this->is_active && $this->totalStock() > 0;
    }

    public static function uniqueSlugFor(string $name): string
    {
        $base = Str::slug($name) ?: 'jersey';
        $slug = $base;
        $suffix = 1;

        while (static::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
