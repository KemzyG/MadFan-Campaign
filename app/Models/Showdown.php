<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Showdown extends Model
{
    public const SIDE_A = 'a';

    public const SIDE_B = 'b';

    protected $fillable = [
        'fandom_id',
        'season_id',
        'title',
        'contestant_a_user_id',
        'contestant_b_user_id',
        'votes_a',
        'votes_b',
        'is_active',
        'closes_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'closes_at' => 'datetime',
            'votes_a' => 'integer',
            'votes_b' => 'integer',
        ];
    }

    public function fandom(): BelongsTo
    {
        return $this->belongsTo(Fandom::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function contestantA(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contestant_a_user_id');
    }

    public function contestantB(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contestant_b_user_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(ShowdownVote::class);
    }

    public function voteEvents(): HasMany
    {
        return $this->hasMany(ShowdownVoteEvent::class);
    }

    /**
     * @param  Builder<Showdown>  $query
     * @return Builder<Showdown>
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function (Builder $inner): void {
                $inner->whereNull('closes_at')->orWhere('closes_at', '>', now());
            });
    }

    public function isOpen(): bool
    {
        return $this->is_active && ($this->closes_at === null || $this->closes_at->isFuture());
    }

    public function totalVotes(): int
    {
        return $this->votes_a + $this->votes_b;
    }

    public function contestantIdForSide(string $side): ?int
    {
        return $side === self::SIDE_A ? $this->contestant_a_user_id : $this->contestant_b_user_id;
    }
}
