<?php

namespace App\Http\Controllers\Inertia\LiveStage;

use App\Http\Controllers\Controller;
use App\Models\LiveStage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LiveStageLifecycleController extends Controller
{
    public function start(Request $request, LiveStage $liveStage, LiveStageService $stages): RedirectResponse
    {
        $this->authorize('start', $liveStage);

        /** @var User $user */
        $user = $request->user();
        $stages->start($liveStage, $user);

        return back()->with('success', 'You are live.');
    }

    public function end(Request $request, LiveStage $liveStage, LiveStageService $stages): RedirectResponse
    {
        $this->authorize('end', $liveStage);

        /** @var User $user */
        $user = $request->user();
        $stages->end($liveStage, $user);

        return redirect()->route('social.live.index')->with('success', 'Stream ended.');
    }
}
