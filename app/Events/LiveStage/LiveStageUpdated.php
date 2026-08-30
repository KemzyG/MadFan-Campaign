<?php

namespace App\Events\LiveStage;

use App\Models\LiveStage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Host changed the stage's title, description, visibility, or comment/
 * reaction toggles while live. Carries only the stage id — same shape as
 * LiveStageStarted — because every client already has a refreshState() path
 * that re-fetches the full presented stage rather than trusting a partial
 * broadcast payload.
 */
class LiveStageUpdated implements ShouldBroadcastNow
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
        return 'stage.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return ['stage_id' => $this->stage->id];
    }
}
