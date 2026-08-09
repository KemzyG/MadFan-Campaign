<?php

namespace App\Events\Social;

use App\Models\Stage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StageRoomUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public Stage $stage,
        public string $reason = 'updated',
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('social.stage.'.$this->stage->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'room.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'stage_id' => $this->stage->id,
            'reason' => $this->reason,
            'status' => $this->stage->status->value,
            'voice_enabled' => (bool) $this->stage->voice_enabled,
        ];
    }
}
