<?php

namespace App\Events\LiveStage;

use App\Models\LiveStage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveStageStarted implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public LiveStage $stage) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('live-stage.'.$this->stage->id)];
    }

    public function broadcastAs(): string
    {
        return 'stage.started';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'stage_id' => $this->stage->id,
            'status' => $this->stage->status->value,
            'started_at' => $this->stage->started_at?->toIso8601String(),
        ];
    }
}
