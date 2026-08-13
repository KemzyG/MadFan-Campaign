<?php

namespace App\Models;

use App\Enums\JerseyOrderStatus;
use Database\Factories\JerseyOrderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class JerseyOrder extends Model
{
    /** @use HasFactory<JerseyOrderFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'code',
        'total',
        'shipping_name',
        'shipping_line1',
        'shipping_line2',
        'shipping_city',
        'shipping_postcode',
        'shipping_country',
        'confirmed_at',
        'fulfilled_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => JerseyOrderStatus::class,
            'total' => 'decimal:2',
            'confirmed_at' => 'datetime',
            'fulfilled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(JerseyOrderItem::class);
    }

    public static function generateCode(): string
    {
        do {
            $code = 'JY'.Str::upper(Str::random(10));
        } while (self::query()->where('code', $code)->exists());

        return $code;
    }
}
