<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Enums\SocialReportStatus;
use App\Enums\SocialReportTarget;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreSocialReportRequest;
use App\Models\Post;
use App\Models\SocialReport;
use Illuminate\Http\RedirectResponse;

class SocialPostReportController extends Controller
{
    public function store(StoreSocialReportRequest $request, Post $post): RedirectResponse
    {
        $this->authorize('view', $post);

        $validated = $request->validated();

        SocialReport::query()->updateOrCreate(
            [
                'reporter_id' => $request->user()->id,
                'target_type' => SocialReportTarget::Post,
                'target_id' => $post->id,
            ],
            [
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
                'status' => SocialReportStatus::Open,
            ],
        );

        return redirect()
            ->route('social.home')
            ->with('success', 'Reported. That post is hidden from your feed.');
    }
}
