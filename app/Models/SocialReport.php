<?php

namespace App\Models;

use App\Enums\SocialReportStatus;
use App\Enums\SocialReportTarget;
use Database\Factories\SocialReportFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialReport extends Model
{
    /** @use HasFactory<SocialReportFactory> */
    use HasFactory;

    protected $fillable = [
        'reporter_id',
        'target_type',
        'target_id',
        'reason',
        'notes',
        'status',
        'assigned_to',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'target_type' => SocialReportTarget::class,
            'status' => SocialReportStatus::class,
        ];
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
