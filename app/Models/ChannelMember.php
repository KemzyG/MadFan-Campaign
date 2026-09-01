<?php

namespace App\Models;

use Database\Factories\ChannelMemberFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChannelMember extends Model
{
    /** @use HasFactory<ChannelMemberFactory> */
    use HasFactory;

    protected $fillable = [
        'channel_id',
        'user_id',
        'role',
        'joined_at',
        'last_read_at',
        'muted_at',
        'archived_at',
        'disappearing_seconds',
        'cleared_before_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'last_read_at' => 'datetime',
            'muted_at' => 'datetime',
            'archived_at' => 'datetime',
            'cleared_before_at' => 'datetime',
            'disappearing_seconds' => 'integer',
        ];
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
