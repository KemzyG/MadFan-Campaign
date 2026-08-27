<?php

namespace App\Http\Controllers\Inertia\LiveStage;

use App\Http\Controllers\Controller;
use App\Http\Requests\LiveStage\StoreLiveStageCommentRequest;
use App\Models\LiveStage;
use App\Models\LiveStageComment;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LiveStageCommentController extends Controller
{
    public function store(StoreLiveStageCommentRequest $request, LiveStage $liveStage, LiveStageService $stages): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $stages->postComment($liveStage, $user, $request->validated('body'));

        return back();
    }

    public function destroy(Request $request, LiveStage $liveStage, LiveStageComment $comment, LiveStageService $stages): RedirectResponse
    {
        $this->authorize('moderate', $liveStage);

        /** @var User $user */
        $user = $request->user();
        $stages->deleteComment($liveStage, $user, $comment);

        return back();
    }
}
