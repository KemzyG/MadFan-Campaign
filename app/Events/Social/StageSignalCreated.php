<?php

namespace App\Events\Social;

use App\Models\StageSignal;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StageSignalCreated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public StageSignal $signal) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('social.stage.'.$this->signal->stage_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'signal.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'signal' => [
                'id' => $this->signal->id,
                'from_user_id' => $this->signal->from_user_id,
                'to_user_id' => $this->signal->to_user_id,
                'type' => $this->signal->type->value,
                'payload' => $this->signal->payload,
                'created_at' => $this->signal->created_at?->toIso8601String(),
            ],
        ];
    }
}
