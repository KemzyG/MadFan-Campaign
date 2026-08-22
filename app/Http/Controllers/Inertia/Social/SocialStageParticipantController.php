<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Stage;
use App\Models\User;
use App\Services\Social\StageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SocialStageParticipantController extends Controller
{
    public function requestSpeak(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('requestSpeak', $stage);

        /** @var User $user */
        $user = $request->user();
        $stages->requestSpeak($stage, $user);

        return back()->with('success', 'Raise hand sent to host.');
    }

    public function promote(Request $request, Stage $stage, User $user, StageService $stages): RedirectResponse
    {
        $this->authorize('manageSpeakers', $stage);

        /** @var User $host */
        $host = $request->user();
        $stages->promote($stage, $host, $user);

        return back()->with('success', 'Promoted to speaker.');
    }

    public function demote(Request $request, Stage $stage, User $user, StageService $stages): RedirectResponse
    {
        $this->authorize('manageSpeakers', $stage);

        /** @var User $host */
        $host = $request->user();
        $stages->demote($stage, $host, $user);

        return back()->with('success', 'Moved back to listeners.');
    }

    public function mute(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('muteSelf', $stage);

        $muted = $request->boolean('muted', true);

        /** @var User $user */
        $user = $request->user();
        $stages->setMuted($stage, $user, $muted);

        return back();
    }

    public function hostMute(Request $request, Stage $stage, User $user, StageService $stages): RedirectResponse
    {
        $this->authorize('hostMute', $stage);

        $muted = $request->boolean('muted', true);

        /** @var User $host */
        $host = $request->user();
        $stages->hostSetMuted($stage, $host, $user, $muted);

        return back()->with('success', $muted ? 'Speaker muted.' : 'Speaker unmuted.');
    }

    public function ban(Request $request, Stage $stage, User $user, StageService $stages): RedirectResponse
    {
        $this->authorize('ban', $stage);

        /** @var User $host */
        $host = $request->user();
        $stages->ban($stage, $host, $user);

        return back()->with('success', 'Removed from Stage.');
    }

    public function transferHost(Request $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('transferHost', $stage);

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        /** @var User $host */
        $host = $request->user();
        $newHost = User::query()->findOrFail($validated['user_id']);
        $stages->transferHost($stage, $host, $newHost);

        return back()->with('success', 'Host transferred.');
    }
}
