<?php

namespace App\Models;

use App\Enums\ChannelType;
use Database\Factories\ChannelFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Channel extends Model
{
    /** @use HasFactory<ChannelFactory> */
    use HasFactory;

    protected $fillable = [
        'club_server_id',
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

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function club(): ?Club
    {
        return $this->clubServer?->club;
    }
}
