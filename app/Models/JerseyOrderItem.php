<?php

namespace App\Models;

use App\Enums\JerseySize;
use Database\Factories\JerseyOrderItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JerseyOrderItem extends Model
{
    /** @use HasFactory<JerseyOrderItemFactory> */
    use HasFactory;

    protected $fillable = [
        'jersey_order_id',
        'jersey_id',
        'jersey_variant_id',
        'name',
        'size',
        'unit_price',
        'quantity',
        'line_total',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => JerseySize::class,
            'unit_price' => 'decimal:2',
            'line_total' => 'decimal:2',
            'quantity' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(JerseyOrder::class, 'jersey_order_id');
    }

    public function jersey(): BelongsTo
    {
        return $this->belongsTo(Jersey::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(JerseyVariant::class, 'jersey_variant_id');
    }
}
