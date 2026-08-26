<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPrediction extends Model
{
    protected $fillable = [
        'prediction_id',
        'user_id',
        'choice',
        'is_correct',
        'points_awarded',
        'point_transaction_id',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'points_awarded' => 'integer',
        ];
    }

    public function prediction(): BelongsTo
    {
        return $this->belongsTo(Prediction::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pointTransaction(): BelongsTo
    {
        return $this->belongsTo(PointTransaction::class);
    }
}
