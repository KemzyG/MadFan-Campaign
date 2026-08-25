<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatUnreadController extends Controller
{
    public function __invoke(Request $request, ChatService $chatService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'unread_count' => $chatService->unreadCount($user),
        ]);
    }
}
