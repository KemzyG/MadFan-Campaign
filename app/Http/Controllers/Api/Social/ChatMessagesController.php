<?php

namespace App\Http\Controllers\Api\Social;

use App\Actions\Social\DeleteChatMessage;
use App\Actions\Social\UpdateChatMessage;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\UpdateChatMessageRequest;
use App\Models\Channel;
use App\Models\Message;
use App\Services\Social\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatMessagesController extends Controller
{
    public function index(Request $request, Channel $channel, ChatService $chatService): JsonResponse
    {
        $this->authorize('view', $channel);

        $beforeId = $request->integer('before_id') ?: null;
        $limit = min($request->integer('limit', ChatService::MESSAGES_PER_PAGE), 100);

        $result = $chatService->paginatedMessages($channel, $beforeId, $limit);

        return response()->json([
            'data' => $chatService->presentMessages($result['messages'], $request->user()),
            'meta' => [
                'has_more' => $result['has_more'],
                'oldest_id' => $result['oldest_id'],
            ],
        ]);
    }

    public function update(
        UpdateChatMessageRequest $request,
        Message $message,
        UpdateChatMessage $updateChatMessage,
        ChatService $chatService,
    ): JsonResponse {
        $this->authorize('update', $message);

        $updated = $updateChatMessage->handle(
            $request->user(),
            $message,
            (string) $request->validated('body'),
        );

        return response()->json([
            'message' => 'Message updated.',
            'data' => $chatService->presentMessage($updated, $request->user()),
        ]);
    }

    public function destroy(
        Request $request,
        Message $message,
        DeleteChatMessage $deleteChatMessage,
    ): JsonResponse {
        $this->authorize('delete', $message);

        $deleteChatMessage->handle($request->user(), $message);

        return response()->json([
            'message' => 'Message deleted.',
            'data' => ['id' => $message->id],
        ]);
    }
}
