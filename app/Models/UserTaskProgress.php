<?php

namespace App\Models;

use App\Support\AdminRouting;
use Database\Factories\UserTaskProgressFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\URL;

class UserTaskProgress extends Model
{
    /** @use HasFactory<UserTaskProgressFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'task_id',
        'season_id',
        'season_week_id',
        'status',
        'is_checked',
        'verification_status',
        'proof_url',
        'proof_image_path',
        'external_handle',
        'external_post_id',
        'verification_payload',
        'confirmed_at',
        'verified_at',
        'claimed_at',
        'failed_at',
        'failure_reason',
        'points_awarded',
        'point_transaction_id',
    ];

    protected function casts(): array
    {
        return [
            'is_checked' => 'boolean',
            'verification_payload' => 'array',
            'confirmed_at' => 'datetime',
            'verified_at' => 'datetime',
            'claimed_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    /**
     * Auth-gated URL for an uploaded proof screenshot, if any.
     */
    protected function proofImageUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! filled($this->proof_image_path) || ! $this->getKey()) {
                return null;
            }

            $request = request();

            if ($request && AdminRouting::isAdminSurface($request)) {
                return URL::route('admin.task-proofs.show', $this);
            }

            return URL::route('task-proofs.show', $this);
        });
    }

    public function hasProof(): bool
    {
        return filled($this->proof_url) || filled($this->proof_image_path);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function seasonWeek(): BelongsTo
    {
        return $this->belongsTo(SeasonWeek::class);
    }

    public function pointTransaction(): BelongsTo
    {
        return $this->belongsTo(PointTransaction::class);
    }

    /**
     * @param  Builder<UserTaskProgress>  $query
     * @return Builder<UserTaskProgress>
     */
    public function scopeFailedVerification(Builder $query): Builder
    {
        return $query->where('verification_status', 'failed');
    }

    /**
     * @param  Builder<UserTaskProgress>  $query
     * @return Builder<UserTaskProgress>
     */
    public function scopeAwaitingReview(Builder $query): Builder
    {
        return $query->where('status', 'confirmed')
            ->where('verification_status', 'pending');
    }
}
