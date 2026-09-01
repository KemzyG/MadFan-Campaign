<?php

namespace App\Actions\Social;

use App\Events\Social\ClubChatMessageDeleted;
use App\Models\Message;
use App\Models\User;
use App\Support\SocialBroadcast;

class DeleteChatMessage
{
    public function handle(User $actor, Message $message): Message
    {
        $message->delete();

        SocialBroadcast::try(fn () => ClubChatMessageDeleted::dispatch($message));

        return $message;
    }
}
