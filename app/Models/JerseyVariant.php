<?php

namespace App\Models;

use App\Enums\JerseySize;
use Database\Factories\JerseyVariantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JerseyVariant extends Model
{
    /** @use HasFactory<JerseyVariantFactory> */
    use HasFactory;

    protected $fillable = [
        'jersey_id',
        'size',
        'stock',
        'sku',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => JerseySize::class,
            'stock' => 'integer',
        ];
    }

    public function jersey(): BelongsTo
    {
        return $this->belongsTo(Jersey::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(JerseyOrderItem::class);
    }

    public function isInStock(int $quantity = 1): bool
    {
        return $this->stock >= $quantity;
    }
}
