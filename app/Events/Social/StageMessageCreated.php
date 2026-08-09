<?php

namespace App\Events\Social;

use App\Models\StageMessage;
use App\Services\Social\StageService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StageMessageCreated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public StageMessage $message) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('social.stage.'.$this->message->stage_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->message->loadMissing('user:id,name,handle,fan_id,avatar_path,avatar_emoji');

        return [
            'message' => app(StageService::class)->presentMessage($this->message),
        ];
    }
}
