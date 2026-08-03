<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePassportRequest;
use App\Http\Resources\PassportResource;
use App\Models\Club;
use App\Models\Passport;
use App\Services\SeasonService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PassportController extends Controller
{
    public function __construct(protected SeasonService $seasonService) {}

    /**
     * Get authenticated user's passport.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['loyaltyTier.tierRewards']);
        $season = $this->seasonService->activeSeason();

        $passport = Passport::with(['user.loyaltyTier', 'season.seasonWeeks'])
            ->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'season_id' => $season->id,
                    'qr_value' => 'MF:'.$user->fan_id,
                    'referral_link' => url('/r/'.$user->fan_id),
                    'share_slug' => Str::slug($user->username.'-'.Str::random(6)),
                    'is_public' => false,
                ]
            );

        if ($passport->season_id !== $season->id) {
            $passport->update(['season_id' => $season->id]);
            $passport->load(['season.seasonWeeks']);
        }

        return response()->json([
            'passport' => new PassportResource($passport->loadMissing(['user.loyaltyTier', 'season.seasonWeeks'])),
        ]);
    }

    /**
     * Update editable profile fields and passport metadata.
     */
    public function update(UpdatePassportRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        $season = $this->seasonService->activeSeason();

        // Update only fields that were actually provided (partial updates).
        $userFields = array_filter(
            array_intersect_key($data, array_flip(['name', 'handle', 'club', 'avatar_emoji'])),
            fn ($v) => $v !== null && $v !== '',
        );

        if (isset($userFields['club'])) {
            $club = Club::query()
                ->with('league:id,name')
                ->where('name', $userFields['club'])
                ->first();

            $userFields['league'] = $club?->league?->name;
        }

        if ($request->hasFile('avatar')) {
            $previousPath = $user->avatar_path;
            $path = $request->file('avatar')->store('avatars', 'public');
            $userFields['avatar_path'] = $path;

            if (filled($previousPath) && $previousPath !== $path) {
                Storage::disk('public')->delete($previousPath);
            }
        }

        if (! empty($userFields)) {
            $user->update($userFields);
            $user->refresh();
        }

        $passport = Passport::with(['user.loyaltyTier', 'season.seasonWeeks'])
            ->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'season_id' => $season->id,
                    'qr_value' => 'MF:'.$user->fan_id,
                    'referral_link' => url('/r/'.$user->fan_id),
                    'share_slug' => Str::slug($user->username.'-'.Str::random(6)),
                    'is_public' => false,
                ]
            );

        if ($passport->season_id !== $season->id) {
            $passport->update(['season_id' => $season->id]);
        }

        // Ensure nested user reflects the just-saved avatar/path.
        $passport->setRelation('user', $user->loadMissing('loyaltyTier'));

        return response()->json([
            'message' => 'Passport updated successfully.',
            'passport' => new PassportResource($passport->loadMissing(['season.seasonWeeks'])),
        ]);
    }
}
