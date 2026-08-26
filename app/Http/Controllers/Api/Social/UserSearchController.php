<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserSearchController extends Controller
{
    /**
     * Find fans by name, handle, username, or fan id — the feed's people search.
     * Unlike FollowController::following, this searches every onboarded fan,
     * not just who the viewer already follows.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $search = trim((string) $request->query('q', ''));

        if ($search === '') {
            return response()->json(['data' => []]);
        }

        $users = User::query()
            ->whereKeyNot($viewer->id)
            ->whereNotNull('social_onboarded_at')
            ->where(function ($query) use ($search): void {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('handle', 'like', '%'.$search.'%')
                    ->orWhere('username', 'like', '%'.$search.'%')
                    ->orWhere('fan_id', 'like', '%'.$search.'%');
            })
            ->with('favouriteClub:id,name,short,logo')
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'handle', 'username', 'fan_id', 'avatar_path', 'favourite_club_id', 'updated_at']);

        $followedIds = Follow::query()
            ->where('follower_id', $viewer->id)
            ->whereIn('following_id', $users->pluck('id'))
            ->pluck('following_id')
            ->all();

        return response()->json([
            'data' => $users->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'handle' => $user->handle ?: $user->username ?: $user->fan_id,
                'avatar_url' => $user->avatar_url,
                'club' => $user->favouriteClub ? [
                    'short' => $user->favouriteClub->short,
                    'logo_url' => $user->favouriteClub->logo_url,
                ] : null,
                'is_following' => in_array($user->id, $followedIds, true),
            ])->values()->all(),
        ]);
    }
}
