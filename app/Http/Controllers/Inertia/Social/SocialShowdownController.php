<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Showdown;
use App\Models\User;
use App\Services\Social\ShowdownService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialShowdownController extends Controller
{
    public function __invoke(Request $request, Showdown $showdown, ShowdownService $showdowns): Response
    {
        /** @var User|null $viewer */
        $viewer = $request->user();

        return Inertia::render('Social/Showdown/Show', [
            'showdown' => $showdowns->present($showdown, $viewer),
        ]);
    }
}
