<?php

namespace App\Models;

use App\Enums\ProductType;
use App\Support\PublicStorageUrl;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'fandom_id',
        'club_id',
        'product_type',
        'category',
        'name',
        'slug',
        'description',
        'brand',
        'image',
        'gallery',
        'price',
        'currency',
        'is_digital',
        'is_active',
        'is_featured',
        'attributes',
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
            'product_type' => ProductType::class,
            'price' => 'decimal:2',
            'is_digital' => 'boolean',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'gallery' => 'array',
            'attributes' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Product $product): void {
            if (blank($product->slug)) {
                $product->slug = static::uniqueSlugFor($product->name);
            }
        });
    }

    public function fandom(): BelongsTo
    {
        return $this->belongsTo(Fandom::class);
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(ProductOrderItem::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType(Builder $query, ProductType|string $type): Builder
    {
        return $query->where('product_type', $type instanceof ProductType ? $type->value : $type);
    }

    public function getImageUrlAttribute(): string
    {
        return PublicStorageUrl::path($this->image);
    }

    /**
     * @return list<string>
     */
    public function getGalleryUrlsAttribute(): array
    {
        return collect($this->gallery ?? [])
            ->map(fn (string $path): string => PublicStorageUrl::path($path))
            ->all();
    }

    /**
     * True stock, unlimited digital goods aside: null means unlimited.
     */
    public function totalStock(): ?int
    {
        $variants = $this->relationLoaded('variants') ? $this->variants : $this->variants()->get();

        if ($variants->contains(fn (ProductVariant $variant): bool => $variant->stock === null)) {
            return null;
        }

        return (int) $variants->sum('stock');
    }

    public function isPurchasable(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $stock = $this->totalStock();

        return $stock === null || $stock > 0;
    }

    public function requiresShipping(): bool
    {
        return ! $this->is_digital;
    }

    public static function uniqueSlugFor(string $name): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $suffix = 1;

        while (static::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
