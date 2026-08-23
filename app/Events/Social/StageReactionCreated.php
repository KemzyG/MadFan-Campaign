<?php

namespace App\Events\Social;

use App\Models\StageReaction;
use App\Services\Social\StageService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StageReactionCreated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public StageReaction $reaction) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('social.stage.'.$this->reaction->stage_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'reaction.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->reaction->loadMissing('user:id,name,handle,fan_id,avatar_path,avatar_emoji');

        return [
            'reaction' => app(StageService::class)->presentReaction($this->reaction),
        ];
    }
}
