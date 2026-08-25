<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\SocialNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function unreadCount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'unread_count' => SocialNotification::query()
                ->where('recipient_id', $user->id)
                ->unread()
                ->count(),
        ]);
    }

    public function read(Request $request, SocialNotification $notification): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($notification->recipient_id !== $user->id) {
            abort(403);
        }

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json(['message' => 'Notification marked read.']);
    }

    public function readAll(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        SocialNotification::query()
            ->where('recipient_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked read.']);
    }
}
