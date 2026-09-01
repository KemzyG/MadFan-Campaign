<?php

namespace App\Models;

use App\Enums\ChannelScope;
use App\Enums\ChannelType;
use Database\Factories\ChannelFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Channel extends Model
{
    /** @use HasFactory<ChannelFactory> */
    use HasFactory;

    protected $fillable = [
        'club_server_id',
        'fandom_server_id',
        'scope',
        'conversation_key',
        'created_by_id',
        'slug',
        'name',
        'type',
        'topic',
        'position',
        'slowmode_seconds',
        'is_read_only',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scope' => ChannelScope::class,
            'type' => ChannelType::class,
            'position' => 'integer',
            'slowmode_seconds' => 'integer',
            'is_read_only' => 'boolean',
        ];
    }

    public function clubServer(): BelongsTo
    {
        return $this->belongsTo(ClubServer::class);
    }

    public function fandomServer(): BelongsTo
    {
        return $this->belongsTo(FandomServer::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(ChannelMember::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'channel_members')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    public function club(): ?Club
    {
        return $this->clubServer?->club;
    }

    public function fandom(): ?Fandom
    {
        return $this->fandomServer?->fandom;
    }

    public function isClub(): bool
    {
        return $this->scope === ChannelScope::Club;
    }

    public function isFandom(): bool
    {
        return $this->scope === ChannelScope::Fandom;
    }

    public function isDirect(): bool
    {
        return $this->scope === ChannelScope::Direct;
    }

    public function isGroup(): bool
    {
        return $this->scope === ChannelScope::Group;
    }

    public function hasMember(User $user): bool
    {
        if ($this->relationLoaded('memberships')) {
            return $this->memberships->contains('user_id', $user->id);
        }

        return $this->memberships()->where('user_id', $user->id)->exists();
    }
}
