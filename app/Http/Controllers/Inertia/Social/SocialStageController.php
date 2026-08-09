<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreSocialStageRequest;
use App\Models\Stage;
use App\Models\User;
use App\Services\Social\StageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialStageController extends Controller
{
    public function index(Request $request, StageService $stages): Response
    {
        $this->authorize('viewAny', Stage::class);

        return Inertia::render('Social/Stage/Index', [
            'stages' => $stages->presentLiveStages(),
            'max_title_length' => StageService::MAX_TITLE_LENGTH,
            'max_speakers' => StageService::MAX_SPEAKERS,
            'voice_note' => 'Native WebRTC mesh voice — max '.StageService::MAX_SPEAKERS.' speakers — Reverb signaling with poll fallback (no SFU)',
        ]);
    }

    public function store(StoreSocialStageRequest $request, StageService $stages): RedirectResponse
    {
        $this->authorize('create', Stage::class);

        /** @var User $user */
        $user = $request->user();
        $stage = $stages->create($user, $request->validated('title'));

        return redirect()
            ->route('social.stage.show', $stage)
            ->with('success', 'Stage is live.');
    }

    public function show(Request $request, Stage $stage, StageService $stages): Response
    {
        $this->authorize('view', $stage);

        /** @var User $user */
        $user = $request->user();

        if ($stage->isLive()) {
            $stages->join($stage, $user);
            $stages->heartbeat($stage, $user);
        }

        $payload = $stages->presentRoom($stage->fresh(), $user);

        return Inertia::render('Social/Stage/Show', $payload);
    }

    public function room(Request $request, Stage $stage, StageService $stages): JsonResponse
    {
        $this->authorize('view', $stage);

        /** @var User $user */
        $user = $request->user();

        if ($stage->isLive() && $stages->activeParticipant($stage, $user) !== null) {
            $stages->heartbeat($stage, $user);
        }

        return response()->json($stages->presentRoom($stage->fresh(), $user));
    }

    public function join(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('join', $stage);

        /** @var User $user */
        $user = $request->user();
        $stages->join($stage, $user);

        return redirect()->route('social.stage.show', $stage);
    }

    public function leave(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('leave', $stage);

        /** @var User $user */
        $user = $request->user();
        $stages->leave($stage, $user);

        return redirect()
            ->route('social.stage.index')
            ->with('success', 'Left the Stage.');
    }

    public function end(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('end', $stage);

        /** @var User $user */
        $user = $request->user();
        $stages->end($stage, $user);

        return redirect()
            ->route('social.stage.index')
            ->with('success', 'Stage ended.');
    }

    public function startVoice(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('startVoice', $stage);

        /** @var User $user */
        $user = $request->user();
        $stages->startVoice($stage, $user);

        return back()->with('success', 'Voice is live - allow mic access.');
    }
}
