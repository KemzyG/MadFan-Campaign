<?php

namespace App\Models;

use Database\Factories\VideoHighlightFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VideoHighlight extends Model
{
    /** @use HasFactory<VideoHighlightFactory> */
    use HasFactory;

    protected $fillable = [
        'author_id',
        'club_id',
        'title',
        'caption',
        'video_url',
        'thumbnail_url',
        'duration_seconds',
        'likes_count',
        'views_count',
        'is_featured',
        'published_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'duration_seconds' => 'integer',
            'likes_count' => 'integer',
            'views_count' => 'integer',
            'is_featured' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(VideoHighlightLike::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function isLikedBy(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        if ($this->relationLoaded('likes')) {
            return $this->likes->contains('user_id', $user->id);
        }

        return $this->likes()->where('user_id', $user->id)->exists();
    }
}
