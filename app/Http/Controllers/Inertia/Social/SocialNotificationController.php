<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\SocialNotification;
use App\Models\User;
use App\Services\Social\SocialNotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialNotificationController extends Controller
{
    public function __invoke(Request $request, SocialNotificationService $notifications): Response
    {
        /** @var User $user */
        $user = $request->user();

        $paginator = SocialNotification::query()
            ->where('recipient_id', $user->id)
            ->with('actor:id,name,handle,username,fan_id,avatar_path,avatar_emoji')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Social/Notifications/Index', [
            'notifications' => $notifications->presentPaginator($paginator),
            'unread_count' => SocialNotification::query()
                ->where('recipient_id', $user->id)
                ->unread()
                ->count(),
        ]);
    }
}
