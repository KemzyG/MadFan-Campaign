<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubMembership;
use App\Models\User;
use App\Services\Social\StandingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialClubProfileController extends Controller
{
    public function __invoke(Request $request, Club $club, StandingsService $standings): Response
    {
        /** @var User $user */
        $user = $request->user();

        $club->loadMissing('league:id,name');

        $topFans = User::query()
            ->where('favourite_club_id', $club->id)
            ->orderByDesc('total_points')
            ->limit(5)
            ->get(['id', 'name', 'handle', 'username', 'fan_id', 'avatar_path', 'total_points'])
            ->map(fn (User $fan) => [
                'id' => $fan->id,
                'name' => $fan->name,
                'handle' => $fan->handle ?: $fan->username ?: $fan->fan_id,
                'avatar_url' => $fan->avatar_url,
                'total_points' => (int) $fan->total_points,
            ])
            ->values()
            ->all();

        return Inertia::render('Social/Clubs/Show', [
            'club' => [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
                'league' => $club->league?->name,
            ],
            'standing' => $standings->standingForClub($club, $user),
            'member_count' => ClubMembership::query()
                ->where('club_id', $club->id)
                ->where('is_primary', true)
                ->count(),
            'top_fans' => $topFans,
            'is_favourite' => $user->favourite_club_id === $club->id,
        ]);
    }
}
