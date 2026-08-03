<?php

namespace App\Models;

use Database\Factories\TaskStepFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskStep extends Model
{
    /** @use HasFactory<TaskStepFactory> */
    use HasFactory;

    protected $fillable = [
        'task_id',
        'step_number',
        'description',
        'link_url',
        'link_label',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
