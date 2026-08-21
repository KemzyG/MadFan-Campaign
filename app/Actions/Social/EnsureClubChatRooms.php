<?php

namespace App\Actions\Social;

use App\Enums\ChannelScope;
use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Club;
use App\Models\ClubServer;
use Illuminate\Support\Facades\DB;

class EnsureClubChatRooms
{
    /**
     * Provision (or return) the club's chat server with default #general + #matchday.
     */
    public function handle(Club $club): ClubServer
    {
        return DB::transaction(function () use ($club): ClubServer {
            $server = ClubServer::query()->firstOrCreate(
                ['club_id' => $club->id],
                ['name' => $club->name.' Terrace'],
            );

            $defaults = [
                [
                    'slug' => 'general',
                    'name' => 'general',
                    'topic' => 'Everyday terrace talk',
                    'position' => 0,
                ],
                [
                    'slug' => 'matchday',
                    'name' => 'matchday',
                    'topic' => 'Live match thread — keep it loud',
                    'position' => 1,
                ],
            ];

            foreach ($defaults as $channel) {
                Channel::query()->firstOrCreate(
                    [
                        'club_server_id' => $server->id,
                        'slug' => $channel['slug'],
                    ],
                    [
                        'scope' => ChannelScope::Club,
                        'name' => $channel['name'],
                        'type' => ChannelType::Text,
                        'topic' => $channel['topic'],
                        'position' => $channel['position'],
                        'slowmode_seconds' => 0,
                        'is_read_only' => false,
                    ],
                );
            }

            return $server->load(['channels', 'club.league']);
        });
    }
}
