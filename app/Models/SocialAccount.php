<?php

namespace App\Models;

use App\Enums\SocialPlatform;
use Database\Factories\SocialAccountFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialAccount extends Model
{
    /** @use HasFactory<SocialAccountFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'platform',
        'platform_user_id',
        'username',
        'display_name',
        'metadata',
        'connected_at',
        'verified_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'platform' => SocialPlatform::class,
            'metadata' => 'array',
            'connected_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verificationIdentifier(): string
    {
        if ($this->platform === SocialPlatform::Telegram || is_numeric($this->platform_user_id)) {
            return $this->platform_user_id;
        }

        return $this->username ?? $this->platform_user_id;
    }
}
