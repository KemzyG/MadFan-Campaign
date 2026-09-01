<?php

namespace App\Actions\Social;

use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\User;
use App\Services\Social\ChatService;

class UpdateChatChannelPreferences
{
    public function __construct(private ChatService $chatService) {}

    /**
     * @param  array{muted?: bool|null, archived?: bool|null, disappearing_seconds?: int|null}  $data
     */
    public function handle(User $viewer, Channel $channel, array $data): ChannelMember
    {
        $member = $this->chatService->membershipFor($viewer, $channel);

        if (array_key_exists('muted', $data)) {
            $member->muted_at = $data['muted'] ? ($member->muted_at ?? now()) : null;
        }

        if (array_key_exists('archived', $data)) {
            $member->archived_at = $data['archived'] ? ($member->archived_at ?? now()) : null;
        }

        if (array_key_exists('disappearing_seconds', $data)) {
            $seconds = $data['disappearing_seconds'];
            $member->disappearing_seconds = $seconds !== null && $seconds > 0 ? $seconds : null;
        }

        $member->save();

        return $member->fresh();
    }
}
