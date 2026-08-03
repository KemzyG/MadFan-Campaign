<?php

namespace App\Models;

use Database\Factories\SeasonWeekFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SeasonWeek extends Model
{
    /** @use HasFactory<SeasonWeekFactory> */
    use HasFactory;

    protected $fillable = [
        'season_id',
        'week_number',
        'code',
        'name',
        'description',
        'starts_at',
        'ends_at',
        'point_multiplier',
        'completion_bonus_points',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'point_multiplier' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function userTaskProgresses(): HasMany
    {
        return $this->hasMany(UserTaskProgress::class);
    }

    public function weeklyProgresses(): HasMany
    {
        return $this->hasMany(WeeklyProgress::class);
    }
}
