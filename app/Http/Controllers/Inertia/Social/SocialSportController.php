<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sport hub — the umbrella Fixtures and the League table sit under. Today
 * there's exactly one sport (Football), so this reads as a single active
 * card plus two destination tiles rather than a real picker; the shape is
 * ready for a second sport without another rewrite.
 */
class SocialSportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $sports = Sport::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Sport $sport): array => [
                'id' => $sport->id,
                'name' => $sport->name,
                'slug' => $sport->slug,
                'is_favourite' => $sport->id === $user->favourite_sport_id,
            ])
            ->values()
            ->all();

        return Inertia::render('Social/Sport/Index', [
            'sports' => $sports,
        ]);
    }
}
