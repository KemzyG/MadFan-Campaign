<?php

namespace App\Models;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Enums\ReplyScope;
use Database\Factories\PostFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    /** @use HasFactory<PostFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'author_id',
        'club_id',
        'stage_id',
        'type',
        'visibility',
        'reply_scope',
        'body',
        'reply_to_id',
        'root_id',
        'quote_of_id',
        'repost_of_id',
        'likes_count',
        'replies_count',
        'reposts_count',
        'quotes_count',
        'views_count',
        'lang',
        'is_hidden',
        'published_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => PostType::class,
            'visibility' => PostVisibility::class,
            'reply_scope' => ReplyScope::class,
            'is_hidden' => 'boolean',
            'published_at' => 'datetime',
            'likes_count' => 'integer',
            'replies_count' => 'integer',
            'reposts_count' => 'integer',
            'quotes_count' => 'integer',
            'views_count' => 'integer',
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

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function taggedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'post_tags')->withTimestamps();
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_id');
    }

    public function root(): BelongsTo
    {
        return $this->belongsTo(self::class, 'root_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'reply_to_id');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(PostLike::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(PostBookmark::class);
    }

    public function hides(): HasMany
    {
        return $this->hasMany(PostHide::class);
    }

    public function views(): HasMany
    {
        return $this->hasMany(PostView::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(PostMedia::class)->orderBy('sort_order');
    }

    public function quoteOf(): BelongsTo
    {
        return $this->belongsTo(self::class, 'quote_of_id');
    }

    public function repostOf(): BelongsTo
    {
        return $this->belongsTo(self::class, 'repost_of_id');
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('is_hidden', false);
    }

    public function scopeTopLevel(Builder $query): Builder
    {
        return $query->whereNull('reply_to_id');
    }

    public function scopeForClub(Builder $query, int $clubId): Builder
    {
        return $query->where('club_id', $clubId);
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

    public function isBookmarkedBy(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        if ($this->relationLoaded('bookmarks')) {
            return $this->bookmarks->contains('user_id', $user->id);
        }

        return $this->bookmarks()->where('user_id', $user->id)->exists();
    }

    public function isHiddenBy(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        if ($this->relationLoaded('hides')) {
            return $this->hides->contains('user_id', $user->id);
        }

        return $this->hides()->where('user_id', $user->id)->exists();
    }
}
