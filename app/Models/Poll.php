<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Poll extends Model
{
    protected $fillable = [
        'fandom_id',
        'season_id',
        'question',
        'is_active',
        'closes_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'closes_at' => 'datetime',
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

    public function options(): HasMany
    {
        return $this->hasMany(PollOption::class)->orderBy('sort_order');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PollVote::class);
    }

    /**
     * @param  Builder<Poll>  $query
     * @return Builder<Poll>
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
        return (int) $this->options->sum('votes_count');
    }
}
