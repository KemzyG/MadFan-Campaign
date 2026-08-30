<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreSocialStageRequest;
use App\Http\Requests\Social\UpdateSocialStageRequest;
use App\Models\Stage;
use App\Models\StageMessage;
use App\Models\User;
use App\Services\Social\StageService;
use App\Support\StageVoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SocialStageController extends Controller
{
    /**
     * "Go Live" (both camera and voice) navigates to /social/live/new —
     * LiveStageController::create's shared page — rather than a sheet fed
     * from here, so this only ever renders the live Voice rooms list.
     */
    public function index(Request $request, StageService $stages): Response
    {
        $this->authorize('viewAny', Stage::class);

        return Inertia::render('Social/Stage/Index', [
            'stages' => $stages->presentLiveStages(),
            'max_speakers' => StageService::MAX_SPEAKERS,
            'voice_note' => StageVoice::usesLiveKit()
                ? 'LiveKit Stage voice — max '.StageService::MAX_SPEAKERS.' speakers — Reverb for room events'
                : 'Stage voice — max '.StageService::MAX_SPEAKERS.' speakers — Reverb signaling with mesh fallback',
        ]);
    }

    public function store(StoreSocialStageRequest $request, StageService $stages): RedirectResponse
    {
        $this->authorize('create', Stage::class);

        /** @var User $user */
        $user = $request->user();
        $stage = $stages->create($user, $request->validated());

        return redirect()
            ->route('social.stage.show', $stage)
            ->with('success', 'Stage is live.');
    }

    /**
     * Live host edit — rename the room, retune the rules, swap the backdrop.
     */
    public function update(UpdateSocialStageRequest $request, Stage $stage, StageService $stages): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $stages->updateSettings($stage, $user, $request->validated());

        return back()->with('success', 'Stage updated.');
    }

    public function show(Request $request, Stage $stage, StageService $stages): Response
    {
        $this->authorize('view', $stage);

        /** @var User $user */
        $user = $request->user();

        if ($stage->isLive()) {
            $stages->join($stage, $user);
            $stages->heartbeat($stage, $user);
            $stages->pruneStaleParticipants($stage);
        }

        $payload = $stages->presentRoom($stage->fresh(), $user);

        return Inertia::render('Social/Stage/Show', $payload);
    }

    public function room(Request $request, Stage $stage, StageService $stages): JsonResponse
    {
        $this->authorize('view', $stage);

        /** @var User $user */
        $user = $request->user();

        if ($stage->isLive()) {
            if ($stages->activeParticipant($stage, $user) !== null) {
                $stages->heartbeat($stage, $user);
            }
            $stages->pruneStaleParticipants($stage);
        }

        return response()->json($stages->presentRoom($stage->fresh(), $user));
    }

    /**
     * Foreground presence ping. Refreshes the caller's last-seen stamp and sweeps
     * participants who have gone silent (closed app / killed tab), ending the
     * Stage if the host is the one who vanished. Kept deliberately light — the
     * client polls `room` for the resulting state.
     */
    public function heartbeat(Request $request, Stage $stage, StageService $stages): JsonResponse
    {
        $this->authorize('view', $stage);

        /** @var User $user */
        $user = $request->user();

        if ($stage->isLive()) {
            if ($stages->activeParticipant($stage, $user) !== null) {
                $stages->heartbeat($stage, $user);
            }
            $stages->pruneStaleParticipants($stage);
        }

        return response()->json(['ok' => true]);
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

    public function share(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('share', $stage);

        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:280'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $stages->shareToFeed($stage, $user, $validated['body'] ?? null);

        return back()->with('success', 'Shared to the terrace feed.');
    }

    public function invite(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('invite', $stage);

        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1', 'max:20'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $invited = $stages->invite($stage, $user, $validated['user_ids']);

        return back()->with(
            $invited > 0 ? 'success' : 'error',
            match (true) {
                $invited === 0 => 'Nobody new to invite — they may already be in the room.',
                $invited === 1 => 'Invite sent.',
                default => "{$invited} invites sent.",
            },
        );
    }

    /**
     * Pin (or, with a null message_id, unpin) a room message.
     */
    public function pin(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('pin', $stage);

        $validated = $request->validate([
            'message_id' => ['nullable', 'integer', 'exists:stage_messages,id'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $message = isset($validated['message_id'])
            ? StageMessage::query()->find($validated['message_id'])
            : null;

        $stages->pinMessage($stage, $user, $message);

        return back()->with('success', $message ? 'Message pinned.' : 'Message unpinned.');
    }

    /**
     * Throw a reaction emoji at the deck.
     */
    public function react(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('react', $stage);

        $validated = $request->validate([
            'emoji' => ['required', 'string', Rule::in(StageService::REACTIONS)],
        ]);

        /** @var User $user */
        $user = $request->user();
        $stages->react($stage, $user, $validated['emoji']);

        return back();
    }
}
