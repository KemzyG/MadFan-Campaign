<?php

namespace App\Actions\Social;

use App\Enums\ChannelScope;
use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateGroupChatChannel
{
    /**
     * @param  list<int>  $memberIds
     */
    public function handle(User $creator, string $name, array $memberIds): Channel
    {
        $name = trim($name);

        if ($name === '') {
            throw ValidationException::withMessages([
                'name' => 'Give the group a name.',
            ]);
        }

        $uniqueMemberIds = collect($memberIds)
            ->map(fn ($id): int => (int) $id)
            ->filter(fn (int $id): bool => $id > 0 && $id !== $creator->id)
            ->unique()
            ->values();

        if ($uniqueMemberIds->isEmpty()) {
            throw ValidationException::withMessages([
                'member_ids' => 'Add at least one friend to the group.',
            ]);
        }

        if ($uniqueMemberIds->count() > 49) {
            throw ValidationException::withMessages([
                'member_ids' => 'Groups can have up to 50 people including you.',
            ]);
        }

        $peers = User::query()
            ->whereIn('id', $uniqueMemberIds->all())
            ->whereNotNull('social_onboarded_at')
            ->get(['id', 'name']);

        if ($peers->count() !== $uniqueMemberIds->count()) {
            throw ValidationException::withMessages([
                'member_ids' => 'One or more fans could not be added.',
            ]);
        }

        foreach ($peers as $peer) {
            if (! $creator->isFollowing($peer) && ! $peer->isFollowing($creator)) {
                throw ValidationException::withMessages([
                    'member_ids' => "You need a follow connection with {$peer->name} first.",
                ]);
            }
        }

        $ulid = (string) Str::ulid();

        return DB::transaction(function () use ($creator, $name, $peers, $ulid): Channel {
            $channel = Channel::query()->create([
                'club_server_id' => null,
                'scope' => ChannelScope::Group,
                'conversation_key' => "group:{$ulid}",
                'created_by_id' => $creator->id,
                'slug' => "group-{$ulid}",
                'name' => $name,
                'type' => ChannelType::Text,
                'topic' => null,
                'position' => 0,
                'slowmode_seconds' => 0,
                'is_read_only' => false,
            ]);

            ChannelMember::query()->create([
                'channel_id' => $channel->id,
                'user_id' => $creator->id,
                'role' => 'admin',
                'joined_at' => now(),
            ]);

            foreach ($peers as $peer) {
                ChannelMember::query()->create([
                    'channel_id' => $channel->id,
                    'user_id' => $peer->id,
                    'role' => 'member',
                    'joined_at' => now(),
                ]);
            }

            return $channel->load(['memberships.user:id,name,handle,fan_id,avatar_path,avatar_emoji']);
        });
    }
}
