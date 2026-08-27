<?php

namespace App\Events\LiveStage;

use App\Models\LiveStage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Ephemeral — fires the floating-emoji animation on every connected client.
 * Never persisted per-event; see LiveStageReactionTotal for the aggregate
 * this same action also bumps.
 */
class LiveStageReactionCreated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public LiveStage $stage,
        public string $emoji,
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
        return 'reaction.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return ['emoji' => $this->emoji];
    }
}
