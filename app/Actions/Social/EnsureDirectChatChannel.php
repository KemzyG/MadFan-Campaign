<?php

namespace App\Actions\Social;

use App\Enums\ChannelScope;
use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EnsureDirectChatChannel
{
    public function handle(User $viewer, User $peer): Channel
    {
        if ($viewer->id === $peer->id) {
            throw ValidationException::withMessages([
                'user_id' => 'You cannot message yourself.',
            ]);
        }

        if (! $this->canMessage($viewer, $peer)) {
            throw ValidationException::withMessages([
                'user_id' => 'Follow each other (or follow them) to start a chat.',
            ]);
        }

        $low = min($viewer->id, $peer->id);
        $high = max($viewer->id, $peer->id);
        $key = "dm:{$low}:{$high}";
        $slug = "dm-{$low}-{$high}";

        return DB::transaction(function () use ($viewer, $peer, $key, $slug): Channel {
            $channel = Channel::query()->firstOrCreate(
                ['conversation_key' => $key],
                [
                    'club_server_id' => null,
                    'scope' => ChannelScope::Direct,
                    'created_by_id' => $viewer->id,
                    'slug' => $slug,
                    'name' => 'Direct',
                    'type' => ChannelType::Text,
                    'topic' => null,
                    'position' => 0,
                    'slowmode_seconds' => 0,
                    'is_read_only' => false,
                ],
            );

            foreach ([$viewer->id, $peer->id] as $userId) {
                ChannelMember::query()->firstOrCreate(
                    [
                        'channel_id' => $channel->id,
                        'user_id' => $userId,
                    ],
                    [
                        'role' => 'member',
                        'joined_at' => now(),
                    ],
                );
            }

            return $channel->load(['memberships.user:id,name,handle,fan_id,avatar_path,avatar_emoji']);
        });
    }

    private function canMessage(User $viewer, User $peer): bool
    {
        return $viewer->isFollowing($peer) || $peer->isFollowing($viewer);
    }
}
