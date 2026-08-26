<?php

namespace App\Http\Controllers\Api\Social;

use App\Actions\Social\SendChatMessage;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreChatMessageRequest;
use App\Models\Channel;
use App\Services\Social\ChatService;
use Illuminate\Http\JsonResponse;

class ChatMessageController extends Controller
{
    public function store(
        StoreChatMessageRequest $request,
        Channel $channel,
        SendChatMessage $sendChatMessage,
        ChatService $chatService,
    ): JsonResponse {
        $this->authorize('sendMessage', $channel);

        $validated = $request->validated();

        $message = $sendChatMessage->handle(
            $request->user(),
            $channel,
            [
                ...$validated,
                'attachment' => $request->file('attachment'),
            ],
        );

        return response()->json([
            'message' => 'Message sent.',
            'data' => $chatService->presentMessage($message, $request->user()),
        ], 201);
    }
}
