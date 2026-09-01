<?php

namespace App\Actions\Social;

use App\Enums\ChannelScope;
use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Fandom;
use App\Models\FandomServer;
use Illuminate\Support\Facades\DB;

/**
 * The fandom equivalent of EnsureClubChatRooms — one #general room per
 * fandom rather than #general + #matchday, since a fandom spans many clubs'
 * fixtures and has no single "matchday" of its own.
 */
class EnsureFandomChatRoom
{
    public function handle(Fandom $fandom): FandomServer
    {
        return DB::transaction(function () use ($fandom): FandomServer {
            $server = FandomServer::query()->firstOrCreate(
                ['fandom_id' => $fandom->id],
                ['name' => $fandom->name.' Terrace'],
            );

            Channel::query()->firstOrCreate(
                [
                    'fandom_server_id' => $server->id,
                    'slug' => 'general',
                ],
                [
                    'scope' => ChannelScope::Fandom,
                    'name' => 'general',
                    'type' => ChannelType::Text,
                    'topic' => 'Everyday talk for every '.$fandom->name.' fan',
                    'position' => 0,
                    'slowmode_seconds' => 0,
                    'is_read_only' => false,
                ],
            );

            return $server->load(['channels', 'fandom']);
        });
    }
}
