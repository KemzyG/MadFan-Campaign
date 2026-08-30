<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\User;
use App\Services\Social\FeedService;
use App\Services\Social\SocialPassportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SocialProfileController extends Controller
{
    public function __invoke(
        Request $request,
        string $handle,
        FeedService $feedService,
        SocialPassportService $socialPassport,
    ): Response {
        /** @var User|null $viewer */
        $viewer = $request->user();

        $profile = User::query()
            ->where(function ($query) use ($handle): void {
                $query->where('handle', $handle)
                    ->orWhere('username', $handle)
                    ->orWhere('fan_id', $handle);
            })
            ->with('favouriteClub:id,name,short,logo')
            ->first();

        if ($profile === null || $profile->social_onboarded_at === null) {
            throw new NotFoundHttpException('Social profile not found.');
        }

        $paginator = $feedService->profilePosts($profile, $viewer);
        $presented = $feedService->presentPaginator($paginator, $viewer);

        return Inertia::render('Social/Profile', [
            'profile' => [
                'id' => $profile->id,
                'name' => $profile->name,
                'handle' => $profile->handle ?: $profile->username ?: $profile->fan_id,
                'fan_id' => $profile->fan_id,
                'bio' => $profile->bio,
                'total_points' => $profile->total_points,
                'current_streak_days' => $profile->current_streak_days,
                'posts_count' => $profile->posts()->whereNull('reply_to_id')->count(),
                'followers_count' => Follow::query()->where('following_id', $profile->id)->count(),
                'following_count' => Follow::query()->where('follower_id', $profile->id)->count(),
                'is_self' => $viewer !== null && $viewer->id === $profile->id,
                'is_following' => $viewer !== null && $viewer->id !== $profile->id && $viewer->isFollowing($profile),
                'is_followed_by' => $viewer !== null && $viewer->id !== $profile->id && $profile->isFollowing($viewer),
                'club' => $profile->favouriteClub ? [
                    'id' => $profile->favouriteClub->id,
                    'name' => $profile->favouriteClub->name,
                    'short' => $profile->favouriteClub->short,
                    'logo_url' => $profile->favouriteClub->logo_url,
                ] : null,
            ],
            'feed' => [
                'posts' => $presented['data'],
                'meta' => $presented['meta'],
                'links' => $presented['links'],
            ],
            'collections' => $socialPassport->collections($profile),
            'max_body_length' => FeedService::MAX_BODY_LENGTH,
        ]);
    }
}
