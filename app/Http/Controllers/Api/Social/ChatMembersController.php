<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\User;
use App\Services\Social\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatMembersController extends Controller
{
    /**
     * Roster for the members modal, fetched client-side when the modal opens so a
     * large club fanbase is never loaded on the thread request itself.
     */
    public function __invoke(Request $request, Channel $channel, ChatService $chatService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($channel->isClub()) {
            abort_unless((int) $channel->clubServer?->club_id === (int) $user->favourite_club_id, 403);
        } else {
            abort_unless($channel->hasMember($user), 403);
        }

        return response()->json([
            'data' => $chatService->presentMembers($channel, $user),
        ]);
    }
}
