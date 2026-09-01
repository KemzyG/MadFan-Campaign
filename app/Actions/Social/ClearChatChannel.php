<?php

namespace App\Actions\Social;

use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\User;
use App\Services\Social\ChatService;

class ClearChatChannel
{
    public function __construct(private ChatService $chatService) {}

    public function handle(User $viewer, Channel $channel): ChannelMember
    {
        $member = $this->chatService->membershipFor($viewer, $channel);
        $member->cleared_before_at = now();
        $member->save();

        return $member->fresh();
    }
}
