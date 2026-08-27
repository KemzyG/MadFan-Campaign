<?php

namespace App\Events\LiveStage;

use App\Models\LiveStage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast on join AND leave — deliberately one "count changed" event rather
 * than separate ViewerJoined/ViewerLeft fan-outs. A popular stream churns
 * viewers constantly; every client only needs the current number, not a log
 * of who came and went, so this is the one payload that actually goes out.
 */
class LiveStageViewerCountUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public LiveStage $stage,
        public int $viewerCount,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('live-stage.'.$this->stage->id)];
    }

    public function broadcastAs(): string
    {
        return 'viewer-count.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'stage_id' => $this->stage->id,
            'viewer_count' => $this->viewerCount,
        ];
    }
}
