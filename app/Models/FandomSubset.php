<?php

namespace App\Models;

use App\Support\PublicStorageUrl;
use Database\Factories\FandomSubsetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A subset within a Fandom category — a league under Football, a game under
 * Esports, a genre under Music. Generic on purpose: every category browses
 * through the same shape rather than each needing its own table.
 */
class FandomSubset extends Model
{
    /** @use HasFactory<FandomSubsetFactory> */
    use HasFactory;

    protected $fillable = [
        'fandom_id',
        'name',
        'slug',
        'image',
        'fan_count',
        'is_trending',
        'sort_order',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'image_url',
    ];

    protected function casts(): array
    {
        return [
            'is_trending' => 'boolean',
            'fan_count' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function fandom(): BelongsTo
    {
        return $this->belongsTo(Fandom::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image !== null ? PublicStorageUrl::path($this->image) : null;
    }
}
