<?php

namespace App\Models;

use Database\Factories\SeasonFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Season extends Model
{
    /** @use HasFactory<SeasonFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'status',
        'starts_at',
        'ends_at',
        'total_weeks',
        'points_budget',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function seasonWeeks(): HasMany
    {
        return $this->hasMany(SeasonWeek::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function passports(): HasMany
    {
        return $this->hasMany(Passport::class);
    }

    public function dailyClaims(): HasMany
    {
        return $this->hasMany(DailyClaim::class);
    }

    public function streakMilestones(): HasMany
    {
        return $this->hasMany(StreakMilestone::class);
    }

    public function referralMilestones(): HasMany
    {
        return $this->hasMany(ReferralMilestone::class);
    }

    public function earnSources(): HasMany
    {
        return $this->hasMany(EarnSource::class);
    }

    public function leaderboardSnapshots(): HasMany
    {
        return $this->hasMany(LeaderboardSnapshot::class);
    }
}
