<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Fandom;
use App\Models\User;
use App\Services\Social\FandomHubService;
use App\Services\Social\PollService;
use App\Services\Social\PredictionService;
use App\Services\Social\ShowdownService;
use App\Services\Social\VideoHighlightService;
use App\Support\Social\FandomContent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * The Fandom hub — a community/discovery front door, not a profile: who this
 * fandom is, what's live right now, how to participate (challenges,
 * predictions, polls), the fan feed, the leaderboard, and what's coming up.
 * One controller, tab-switched via `?tab=`, mirroring the Chat page's
 * inbox/view param pattern rather than a route per tab. Browsing which
 * fandom to open in the first place happens one level up, at
 * SocialFandomDiscoveryController (/social/fandom).
 */
class SocialFandomController extends Controller
{
    private const TABS = ['home', 'feed', 'live', 'events', 'more'];

    public function __invoke(
        Request $request,
        Fandom $fandom,
        FandomHubService $hub,
        PredictionService $predictions,
        PollService $polls,
        ShowdownService $showdowns,
        VideoHighlightService $videos,
    ): Response {
        /** @var User|null $user */
        $user = $request->user();

        if (! $fandom->is_active) {
            throw new NotFoundHttpException('No active fandom.');
        }

        $tab = $request->string('tab')->toString();
        $tab = in_array($tab, self::TABS, true) ? $tab : 'home';

        $predictions->ensureForUpcomingFixtures($fandom);

        $payload = [
            'fandom' => $hub->header($fandom, $user),
            'tab' => $tab,
        ];

        if ($tab === 'home') {
            $payload['home'] = [
                'pulse' => $hub->pulse($fandom),
                'trending' => $hub->trending($user),
                'challenges' => $hub->challenges(4),
                'predictions' => $predictions->openForFandom($fandom, $user, 3),
                'polls' => $polls->openForFandom($fandom, $user, 2),
                'showdowns' => $showdowns->openForFandom($fandom, $user, 2),
                'feed' => $hub->feedExcerpt($user, 5),
                'leaderboard' => $hub->leaderboardExcerpt($fandom, $user, 5),
                'upcoming' => $hub->upcoming(4),
            ];
        }

        if ($tab === 'feed') {
            $payload['feed_full'] = $hub->feedExcerpt($user, 20);
        }

        if ($tab === 'live') {
            $payload['live_full'] = $hub->liveFeed($user, 30);
        }

        if ($tab === 'events') {
            $payload['events_full'] = $hub->upcoming(20);
            $payload['predictions_full'] = $predictions->openForFandom($fandom, $user, 20);
        }

        if ($tab === 'more') {
            $payload['more'] = [
                'about' => FandomContent::about($fandom),
                'history' => FandomContent::history(),
                'rules' => FandomContent::rules(),
                'media' => $videos->presentMany($videos->feed(6)->items(), $user),
            ];
        }

        return Inertia::render('Social/Fandom/Index', $payload);
    }
}
