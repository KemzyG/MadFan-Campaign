<?php

namespace App\Models;

use Database\Factories\EarnSourceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EarnSource extends Model
{
    /** @use HasFactory<EarnSourceFactory> */
    use HasFactory;

    protected $fillable = [
        'season_id',
        'name',
        'points_min',
        'points_max',
        'points_label',
        'description',
        'display_order',
    ];

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }
}
