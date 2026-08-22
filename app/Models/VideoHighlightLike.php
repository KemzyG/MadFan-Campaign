<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoHighlightLike extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'video_highlight_id',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function videoHighlight(): BelongsTo
    {
        return $this->belongsTo(VideoHighlight::class);
    }
}
