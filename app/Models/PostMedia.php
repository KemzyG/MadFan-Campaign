<?php

namespace App\Models;

use App\Enums\MediaType;
use App\Support\PublicStorageUrl;
use Database\Factories\PostMediaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostMedia extends Model
{
    /** @use HasFactory<PostMediaFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'post_id',
        'type',
        'path',
        'width',
        'height',
        'sort_order',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => MediaType::class,
            'width' => 'integer',
            'height' => 'integer',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function getUrlAttribute(): string
    {
        return PublicStorageUrl::path($this->path);
    }
}
