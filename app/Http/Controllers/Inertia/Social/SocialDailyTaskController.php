<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\SocialDailyTaskService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialDailyTaskController extends Controller
{
    public function __invoke(Request $request, SocialDailyTaskService $tasks): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('Social/DailyTasks/Index', [
            'today' => $tasks->today($user),
        ]);
    }
}
