<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\CreateVideoHighlight;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreVideoHighlightRequest;
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
            'limits' => [
                'max_upload_kb' => VideoHighlightService::MAX_UPLOAD_KB,
                'max_duration_seconds' => VideoHighlightService::MAX_DURATION_SECONDS,
                'max_caption_length' => VideoHighlightService::MAX_CAPTION_LENGTH,
            ],
        ]);
    }

    public function store(
        StoreVideoHighlightRequest $request,
        CreateVideoHighlight $createVideoHighlight,
    ): RedirectResponse {
        $validated = $request->validated();

        $createVideoHighlight->handle($request->user(), [
            'video' => $request->file('video'),
            'title' => $validated['title'] ?? null,
            'caption' => $validated['caption'] ?? null,
            'duration_seconds' => $validated['duration_seconds'] ?? null,
        ]);

        return redirect()
            ->route('social.videos.index')
            ->with('success', 'Reel published.');
    }

    public function like(Request $request, VideoHighlight $videoHighlight, VideoHighlightService $videos): RedirectResponse
    {
        $this->authorize('like', $videoHighlight);

        /** @var User $user */
        $user = $request->user();

        $videos->toggleLike($videoHighlight, $user);

        return back();
    }

    public function view(Request $request, VideoHighlight $videoHighlight, VideoHighlightService $videos): RedirectResponse
    {
        $this->authorize('view', $videoHighlight);

        $videos->recordView($videoHighlight);

        return back();
    }
}
