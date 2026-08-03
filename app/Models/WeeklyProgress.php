<?php

namespace App\Models;

use Database\Factories\WeeklyProgressFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklyProgress extends Model
{
    /** @use HasFactory<WeeklyProgressFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'season_id',
        'season_week_id',
        'tasks_done',
        'tasks_total',
        'completion_bonus_awarded',
        'completion_bonus_points',
        'completion_bonus_transaction_id',
    ];

    protected function casts(): array
    {
        return [
            'completion_bonus_awarded' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function seasonWeek(): BelongsTo
    {
        return $this->belongsTo(SeasonWeek::class);
    }

    public function completionBonusTransaction(): BelongsTo
    {
        return $this->belongsTo(PointTransaction::class, 'completion_bonus_transaction_id');
    }
}
