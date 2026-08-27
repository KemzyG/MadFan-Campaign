<?php

namespace App\Events\LiveStage;

use App\Models\LiveStageComment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveStageCommentCreated implements ShouldBroadcastNow
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
        return 'comment.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $user = $this->comment->user;

        return [
            'id' => $this->comment->id,
            'body' => $this->comment->body,
            'created_at' => $this->comment->created_at?->toIso8601String(),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'handle' => $user->handle,
                'avatar_emoji' => $user->avatar_emoji,
                'avatar_url' => $user->avatar_url,
            ],
        ];
    }
}
