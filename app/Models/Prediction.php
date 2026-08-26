<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prediction extends Model
{
    public const CHOICE_HOME = 'home';

    public const CHOICE_DRAW = 'draw';

    public const CHOICE_AWAY = 'away';

    protected $fillable = [
        'match_fixture_id',
        'fandom_id',
        'season_id',
        'points_reward',
        'closes_at',
        'correct_choice',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'closes_at' => 'datetime',
            'resolved_at' => 'datetime',
            'points_reward' => 'integer',
        ];
    }

    public function matchFixture(): BelongsTo
    {
        return $this->belongsTo(MatchFixture::class);
    }

    public function fandom(): BelongsTo
    {
        return $this->belongsTo(Fandom::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function userPredictions(): HasMany
    {
        return $this->hasMany(UserPrediction::class);
    }

    public function isOpen(): bool
    {
        return $this->resolved_at === null && $this->closes_at->isFuture();
    }

    public function isResolved(): bool
    {
        return $this->resolved_at !== null;
    }
}
