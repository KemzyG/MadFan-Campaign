<?php

namespace App\Events\LiveStage;

use App\Models\LiveStageComment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveStageCommentDeleted implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public LiveStageComment $comment) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('live-stage.'.$this->comment->live_stage_id)];
    }

    public function broadcastAs(): string
    {
        return 'comment.deleted';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return ['id' => $this->comment->id];
    }
}
