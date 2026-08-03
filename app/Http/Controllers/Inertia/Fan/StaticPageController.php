<?php

namespace App\Http\Controllers\Inertia\Fan;

use App\Http\Controllers\Controller;
use App\Support\MadFanStory;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class StaticPageController extends Controller
{
    public function show(string $page): InertiaResponse|Response
    {
        if (! in_array($page, MadFanStory::slugs(), true)) {
            abort(404);
        }

        $content = MadFanStory::page($page);

        if ($page === 'team') {
            return Inertia::render('Fan/Team', [
                'slug' => 'team',
                ...$content,
            ]);
        }

        return Inertia::render('Fan/StaticPage', [
            'slug' => $page,
            ...$content,
        ]);
    }
}
