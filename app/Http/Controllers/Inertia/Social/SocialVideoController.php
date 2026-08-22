<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VideoHighlight;
use App\Services\Social\VideoHighlightService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialVideoController extends Controller
{
    public function index(Request $request, VideoHighlightService $videos): Response
    {
        /** @var User $user */
        $user = $request->user();

        $paginator = $videos->feed();

        return Inertia::render('Social/Videos/Index', [
            'reels' => [
                'items' => $videos->presentMany($paginator->items(), $user),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    public function like(Request $request, VideoHighlight $videoHighlight, VideoHighlightService $videos): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $videos->toggleLike($videoHighlight, $user);

        return back();
    }

    public function view(Request $request, VideoHighlight $videoHighlight, VideoHighlightService $videos): RedirectResponse
    {
        $videos->recordView($videoHighlight);

        return back();
    }
}
