<?php

namespace App\Models;

use App\Casts\ChatEncryptedText;
use App\Enums\MessageType;
use App\Support\PublicStorageUrl;
use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'channel_id',
        'author_id',
        'type',
        'body',
        'media_path',
        'media_type',
        'media_width',
        'media_height',
        'reply_to_message_id',
        'edited_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => MessageType::class,
            'edited_at' => 'datetime',
            'body' => ChatEncryptedText::class,
            'media_width' => 'integer',
            'media_height' => 'integer',
        ];
    }

    public function getMediaUrlAttribute(): ?string
    {
        if ($this->media_path === null) {
            return null;
        }

        return PublicStorageUrl::path($this->media_path);
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_message_id');
    }
}
