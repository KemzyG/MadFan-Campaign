<?php

namespace App\Actions\Social;

use App\Events\Social\ClubChatMessageUpdated;
use App\Models\Message;
use App\Models\User;
use App\Services\Social\ChatService;
use App\Support\SocialBroadcast;
use Illuminate\Validation\ValidationException;

class UpdateChatMessage
{
    public function handle(User $actor, Message $message, string $body): Message
    {
        $body = trim($body);

        if ($body === '') {
            throw ValidationException::withMessages([
                'body' => 'Message cannot be empty.',
            ]);
        }

        if (mb_strlen($body) > ChatService::MAX_BODY_LENGTH) {
            throw ValidationException::withMessages([
                'body' => 'Keep it to '.ChatService::MAX_BODY_LENGTH.' characters.',
            ]);
        }

        $message->update([
            'body' => $body,
            'edited_at' => now(),
        ]);

        $message->load([
            'author:id,name,handle,fan_id,avatar_path,avatar_emoji',
            'replyTo:id,author_id,body,type',
            'replyTo.author:id,name',
        ]);

        SocialBroadcast::try(fn () => ClubChatMessageUpdated::dispatch($message));

        return $message;
    }
}
