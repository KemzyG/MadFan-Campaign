<?php

namespace App\Models;

use App\Enums\MatchStatus;
use Database\Factories\MatchFixtureFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MatchFixture extends Model
{
    /** @use HasFactory<MatchFixtureFactory> */
    use HasFactory;

    protected $fillable = [
        'home_club_id',
        'away_club_id',
        'kickoff_at',
        'venue',
        'status',
        'home_score',
        'away_score',
        'price',
        'competition',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'kickoff_at' => 'datetime',
            'status' => MatchStatus::class,
            'home_score' => 'integer',
            'away_score' => 'integer',
            'price' => 'decimal:2',
        ];
    }

    public function homeClub(): BelongsTo
    {
        return $this->belongsTo(Club::class, 'home_club_id');
    }

    public function awayClub(): BelongsTo
    {
        return $this->belongsTo(Club::class, 'away_club_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(MatchTicket::class);
    }

    public function prediction(): HasOne
    {
        return $this->hasOne(Prediction::class);
    }

    public function isFinished(): bool
    {
        return $this->status === MatchStatus::Finished
            && $this->home_score !== null
            && $this->away_score !== null;
    }

    /**
     * @param  Builder<MatchFixture>  $query
     * @return Builder<MatchFixture>
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query
            ->where('status', MatchStatus::Upcoming)
            ->where('kickoff_at', '>=', now())
            ->orderBy('kickoff_at');
    }

    public function isPurchasable(): bool
    {
        return $this->status === MatchStatus::Upcoming
            && $this->kickoff_at !== null
            && $this->kickoff_at->isFuture();
    }
}
