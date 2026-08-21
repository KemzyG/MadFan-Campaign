<?php

namespace App\Http\Controllers\Inertia\Fan;

use App\Http\Controllers\Controller;
use App\Models\Jersey;
use App\Services\Fan\LandingMediaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageController extends Controller
{
    public function __invoke(Request $request, LandingMediaService $landingMedia): Response
    {
        $media = $landingMedia->present();

        $catalogKits = Jersey::query()
            ->active()
            ->latest('id')
            ->limit(6)
            ->get()
            ->map(fn (Jersey $jersey): array => [
                'id' => (string) $jersey->id,
                'name' => $jersey->name,
                'slug' => $jersey->slug,
                'image_url' => $jersey->image_url,
                'price' => (string) $jersey->price,
            ])
            ->values()
            ->all();

        $featured = $catalogKits !== []
            ? $catalogKits
            : $media['kits'];

        return Inertia::render('Fan/Landing', [
            'images' => [
                'hero' => $media['hero'],
                'categories' => $media['categories'],
            ],
            'featured' => $featured,
        ]);
    }
}
