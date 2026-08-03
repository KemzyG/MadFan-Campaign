<?php

namespace App\Http\Controllers;

use App\Http\Resources\LeaderboardEntryResource;
use App\Models\Season;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    /**
     * Return the live points leaderboard for the active season.
     */
    public function index(Request $request): JsonResponse
    {
        $limit = min(max((int) $request->query('limit', 50), 1), 100);
        $user = $request->user();
        $season = Season::where('status', 'active')->latest('starts_at')->first();

        $topUsers = User::query()
            ->fanAccounts()
            ->with('loyaltyTier')
            ->orderByDesc('total_points')
            ->orderBy('id')
            ->limit($limit)
            ->get()
            ->values()
            ->map(function (User $rankedUser, int $index): User {
                $rankedUser->setAttribute('rank', $index + 1);

                return $rankedUser;
            });

        $usersAhead = User::query()
            ->fanAccounts()
            ->where(function ($query) use ($user): void {
                $query->where('total_points', '>', $user->total_points)
                    ->orWhere(function ($query) use ($user): void {
                        $query->where('total_points', $user->total_points)
                            ->where('id', '<', $user->id);
                    });
            })
            ->count();

        $currentUser = $user->load('loyaltyTier');
        $currentUser->setAttribute('rank', $usersAhead + 1);

        return response()->json([
            'season' => $season ? [
                'id' => $season->id,
                'code' => $season->code,
                'name' => $season->name,
                'status' => $season->status,
            ] : null,
            'entries' => LeaderboardEntryResource::collection($topUsers),
            'current_user' => new LeaderboardEntryResource($currentUser),
            'total_users' => User::query()->fanAccounts()->count(),
        ]);
    }
}
