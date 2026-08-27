<?php

namespace App\Http\Controllers\Inertia\LiveStage;

use App\Http\Controllers\Controller;
use App\Models\LiveStage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LiveStageReactionController extends Controller
{
    public function store(Request $request, LiveStage $liveStage, LiveStageService $stages): RedirectResponse
    {
        $this->authorize('react', $liveStage);

        $validated = $request->validate([
            'emoji' => ['required', 'string', Rule::in(LiveStageService::REACTIONS)],
        ]);

        /** @var User $user */
        $user = $request->user();
        $stages->react($liveStage, $user, $validated['emoji']);

        return back();
    }
}
