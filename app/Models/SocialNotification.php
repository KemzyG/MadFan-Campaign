<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * A single in-app notification for one recipient — a like, a reply, a tag, a
 * chat message, or a published announcement. `notifiable` is whatever the
 * notification is about (the liked/replied-to Post, the Message, the
 * SocialAnnouncement); `actor` is who caused it (null for system events).
 */
class SocialNotification extends Model
{
    public const TYPE_POST_LIKED = 'post_liked';

    public const TYPE_POST_REPLIED = 'post_replied';

    public const TYPE_POST_TAGGED = 'post_tagged';

    public const TYPE_CHAT_MESSAGE = 'chat_message';

    public const TYPE_ANNOUNCEMENT = 'announcement';

    public const TYPE_STAGE_INVITE = 'stage_invite';

    protected $fillable = [
        'recipient_id',
        'actor_id',
        'type',
        'notifiable_type',
        'notifiable_id',
        'data',
        'read_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @param  Builder<SocialNotification>  $query
     * @return Builder<SocialNotification>
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }
}
