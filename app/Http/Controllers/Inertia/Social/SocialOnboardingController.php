<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Fandom;
use App\Models\FandomFollow;
use App\Models\User;
use App\Services\Social\SocialPassportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Onboarding is single-step: pick a fandom. There used to be a second
 * "Choose your club" step (see git history / SocialOnboardingController
 * before this class) — favourite_club_id is no longer part of what it
 * means to be onboarded onto Social; a fan's fandom is now the whole
 * community identity this flow establishes.
 */
class SocialOnboardingController extends Controller
{
    public function fandom(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->favourite_fandom_id !== null && $user->social_onboarded_at !== null) {
            return redirect()->route('social.home');
        }

        $fandoms = Fandom::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->values()
            ->all();

        return Inertia::render('Social/Onboarding/PickFandom', [
            'fandoms' => $fandoms,
        ]);
    }

    public function storeFandom(Request $request, SocialPassportService $socialPassport): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'fandom_id' => ['required', 'integer', 'exists:fandoms,id'],
        ]);

        $user->forceFill([
            'favourite_fandom_id' => $validated['fandom_id'],
            'social_onboarded_at' => $user->social_onboarded_at ?? now(),
        ])->save();

        FandomFollow::query()->firstOrCreate([
            'user_id' => $user->id,
            'fandom_id' => $validated['fandom_id'],
        ]);

        $socialPassport->syncSnapshot($user->fresh());

        $fandom = Fandom::find($validated['fandom_id']);

        return redirect()
            ->route('social.home')
            ->with('success', 'You’re in. Welcome to the '.($fandom?->name ?? 'fandom').' terrace.');
    }
}
