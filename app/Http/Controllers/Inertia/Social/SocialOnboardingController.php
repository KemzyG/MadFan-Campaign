<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubMembership;
use App\Models\User;
use App\Services\Social\SocialPassportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SocialOnboardingController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->social_onboarded_at !== null && $user->favourite_club_id !== null) {
            return redirect()->route('social.home');
        }

        $clubs = Club::query()
            ->with('league:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (Club $club) => [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
                'league' => $club->league?->name,
            ])
            ->values()
            ->all();

        return Inertia::render('Social/Onboarding/PickClub', [
            'clubs' => $clubs,
            'current_club_id' => $user->favourite_club_id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'club_id' => ['required', 'integer', 'exists:clubs,id'],
        ]);

        $club = Club::query()->with('league:id,name')->findOrFail($validated['club_id']);

        DB::transaction(function () use ($user, $club): void {
            ClubMembership::query()
                ->where('user_id', $user->id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);

            ClubMembership::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'club_id' => $club->id,
                ],
                [
                    'is_primary' => true,
                    'role' => 'member',
                    'notifications' => 'all',
                ],
            );

            $user->forceFill([
                'favourite_club_id' => $club->id,
                'club' => $club->name,
                'league' => $club->league?->name,
                'social_onboarded_at' => now(),
            ])->save();

            app(SocialPassportService::class)->syncSnapshot($user->fresh());
        });

        return redirect()
            ->route('social.home')
            ->with('success', 'You’re in. Welcome to the '.$club->name.' terrace.');
    }
}
