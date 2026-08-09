<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreStageMessageRequest;
use App\Models\Stage;
use App\Models\User;
use App\Services\Social\StageService;
use Illuminate\Http\RedirectResponse;

class SocialStageMessageController extends Controller
{
    public function store(StoreStageMessageRequest $request, Stage $stage, StageService $stages): RedirectResponse
    {
        $this->authorize('sendMessage', $stage);

        /** @var User $user */
        $user = $request->user();
        $stages->storeMessage($stage, $user, $request->validated('body'));

        return back();
    }
}
