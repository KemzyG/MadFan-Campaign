<?php

namespace App\Events\LiveStage;

use App\Enums\LiveStageModerationAction;
use App\Models\LiveStage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast to the whole room so a removed/banned viewer's own client reacts
 * immediately (forced back to the ended/removed state) rather than only
 * finding out the next time it happens to poll or take an action.
 */
class LiveStageViewerModerated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public LiveStage $stage,
        public int $targetUserId,
        public LiveStageModerationAction $action,
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
        return 'viewer.moderated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'target_user_id' => $this->targetUserId,
            'action' => $this->action->value,
        ];
    }
}
