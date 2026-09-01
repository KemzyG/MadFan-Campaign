<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Poll;
use App\Models\User;
use App\Services\Social\PollService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialPollController extends Controller
{
    public function __invoke(Request $request, Poll $poll, PollService $polls): Response
    {
        /** @var User|null $viewer */
        $viewer = $request->user();

        return Inertia::render('Social/Polls/Show', [
            'poll' => $polls->present($poll, $viewer),
        ]);
    }
}
