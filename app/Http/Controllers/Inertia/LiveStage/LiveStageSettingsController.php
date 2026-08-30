<?php

namespace App\Http\Controllers\Inertia\LiveStage;

use App\Http\Controllers\Controller;
use App\Http\Requests\LiveStage\UpdateLiveStageSettingsRequest;
use App\Models\LiveStage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;
use Illuminate\Http\JsonResponse;

class LiveStageSettingsController extends Controller
{
    /**
     * The host's Settings/Customization panel — title, description,
     * visibility, and the comment/reaction toggles. Returns the freshly
     * presented stage so the panel can update local state without waiting
     * on the broadcast round-trip.
     */
    public function update(UpdateLiveStageSettingsRequest $request, LiveStage $liveStage, LiveStageService $stages): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $stage = $stages->updateSettings($liveStage, $user, $request->validated());

        return response()->json([
            'stage' => $stages->presentStage($stage, $user),
        ]);
    }
}
