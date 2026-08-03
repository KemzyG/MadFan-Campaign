<?php

namespace App\Models;

use App\Enums\TaskAudience;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    protected $fillable = [
        'season_id',
        'season_week_id',
        'code',
        'name',
        'description',
        'points',
        'platform',
        'task_type',
        'audience',
        'staff_position',
        'assigned_user_id',
        'external_url',
        'verification_required',
        'is_active',
        'display_order',
        'starts_at',
        'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'verification_required' => 'boolean',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    /**
     * @param  Builder<Task>  $query
     */
    public function scopeForFans(Builder $query): Builder
    {
        return $query->where(function (Builder $query): void {
            $query->where('audience', TaskAudience::Fan->value)
                ->orWhereNull('audience');
        });
    }

    /**
     * @param  Builder<Task>  $query
     */
    public function scopeVisibleToStaffUser(Builder $query, User $user): Builder
    {
        return $query
            ->where('audience', TaskAudience::Staff->value)
            ->where(function (Builder $query) use ($user): void {
                $query->where('assigned_user_id', $user->id)
                    ->orWhere(function (Builder $query) use ($user): void {
                        $query->whereNull('assigned_user_id')
                            ->where(function (Builder $query) use ($user): void {
                                $query->whereNull('staff_position');

                                if (filled($user->staff_position)) {
                                    $query->orWhere('staff_position', $user->staff_position);
                                }
                            });
                    });
            });
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function seasonWeek(): BelongsTo
    {
        return $this->belongsTo(SeasonWeek::class);
    }

    public function taskSteps(): HasMany
    {
        return $this->hasMany(TaskStep::class);
    }

    public function userTaskProgresses(): HasMany
    {
        return $this->hasMany(UserTaskProgress::class);
    }
}
