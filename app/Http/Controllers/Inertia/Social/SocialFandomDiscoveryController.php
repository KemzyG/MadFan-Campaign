<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\FandomDiscoveryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Fandom tab's landing screen — browse every category (Sports, Esports,
 * Music, Books, ...) before picking one to open its hub. The hub itself
 * (Home/Feed/Live/Events/More for one already-chosen fandom) lives at
 * /social/fandom/{fandom:slug}, handled by SocialFandomController.
 */
class SocialFandomDiscoveryController extends Controller
{
    public function __invoke(Request $request, FandomDiscoveryService $discovery): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        $group = $request->string('group')->toString() ?: null;

        return Inertia::render('Social/Fandom/Discover/Discover', [
            'groups' => $discovery->presentGroups($group),
            'active_group' => $group ?: 'all',
            'popular' => $discovery->presentPopular($user, $group),
            'categories' => $discovery->presentCategories($group),
            'trending' => $discovery->presentTrending(),
        ]);
    }
}
