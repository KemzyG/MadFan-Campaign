<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FollowController extends Controller
{
    /**
     * People the viewer follows — source for the composer's tag-friends picker.
     * Optional `q` filters by name / handle / username / fan id.
     */
    public function following(Request $request): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $search = trim((string) $request->query('q', ''));

        $followedIds = Follow::query()
            ->where('follower_id', $viewer->id)
            ->pluck('following_id');

        $users = User::query()
            ->whereIn('id', $followedIds)
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', '%'.$search.'%')
                        ->orWhere('handle', 'like', '%'.$search.'%')
                        ->orWhere('username', 'like', '%'.$search.'%')
                        ->orWhere('fan_id', 'like', '%'.$search.'%');
                });
            })
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'handle', 'username', 'fan_id', 'avatar_path', 'updated_at']);

        return response()->json([
            'data' => $users->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'handle' => $user->handle ?: $user->username ?: $user->fan_id,
                'avatar_url' => $user->avatar_url,
            ])->all(),
        ]);
    }

    public function store(Request $request, User $user): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        if ($viewer->id === $user->id) {
            throw ValidationException::withMessages([
                'user' => 'You cannot follow yourself.',
            ]);
        }

        Follow::query()->firstOrCreate(
            [
                'follower_id' => $viewer->id,
                'following_id' => $user->id,
            ],
            [
                'created_at' => now(),
            ],
        );

        return response()->json([
            'message' => 'Following '.$user->name.'.',
            'following' => true,
            'user_id' => $user->id,
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        Follow::query()
            ->where('follower_id', $viewer->id)
            ->where('following_id', $user->id)
            ->delete();

        return response()->json([
            'message' => 'Unfollowed '.$user->name.'.',
            'following' => false,
            'user_id' => $user->id,
        ]);
    }
}
