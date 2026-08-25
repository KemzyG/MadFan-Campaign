<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\FeedService;
use App\Services\Social\SocialPassportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialYouController extends Controller
{
    public function __invoke(Request $request, SocialPassportService $socialPassport, FeedService $feedService): Response
    {
        /** @var User $user */
        $user = $request->user();

        $paginator = $feedService->profilePosts($user, $user);
        $presented = $feedService->presentPaginator($paginator, $user);

        return Inertia::render('Social/You', [
            ...$socialPassport->present($user),
            'feed' => [
                'posts' => $presented['data'],
                'meta' => $presented['meta'],
                'links' => $presented['links'],
            ],
            'max_body_length' => FeedService::MAX_BODY_LENGTH,
        ]);
    }
}
