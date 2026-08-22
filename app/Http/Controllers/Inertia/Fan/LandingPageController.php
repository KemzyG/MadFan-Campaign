<?php

namespace App\Http\Controllers\Inertia\Fan;

use App\Http\Controllers\Controller;
use App\Models\Jersey;
use App\Models\Waitlist;
use App\Services\Fan\LandingMediaService;
use App\Support\MadFanStory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageController extends Controller
{
    public function __invoke(Request $request, LandingMediaService $landingMedia): Response
    {
        $media = $landingMedia->present();
        $story = MadFanStory::landingHighlights();
        $featured = $this->resolveFeaturedKits($media['kits']);

        return Inertia::render('Fan/Landing', [
            'images' => [
                'hero' => $media['hero'],
                'phones' => $media['phones'],
                'categories' => $media['categories'],
            ],
            'featured' => $featured,
            'stats' => [
                'waitlist_count' => Waitlist::query()->count(),
                'season_weeks' => 8,
                'points_pool' => '500K',
            ],
            'story' => $story,
        ]);
    }

    /**
     * Prefer live catalog rows with real product art; otherwise show synced
     * landing kit PNGs (home / away / training) with shop slugs when available.
     *
     * @param  list<array{id: string, name: string, image_url: string, slug: null}>  $mediaKits
     * @return list<array{id: string, name: string, slug: string|null, image_url: string, price?: string}>
     */
    private function resolveFeaturedKits(array $mediaKits): array
    {
        $catalogKits = Jersey::query()
            ->active()
            ->with('mediaAssets')
            ->latest('id')
            ->limit(6)
            ->get()
            ->filter(fn (Jersey $jersey): bool => $this->jerseyHasProductImage($jersey))
            ->map(fn (Jersey $jersey): array => [
                'id' => (string) $jersey->id,
                'name' => $jersey->name,
                'slug' => $jersey->slug,
                'image_url' => $jersey->image_url,
                'price' => (string) $jersey->price,
            ])
            ->values()
            ->all();

        if ($catalogKits !== []) {
            return $catalogKits;
        }

        if ($mediaKits === []) {
            return [];
        }

        return $this->enrichMediaKitsWithShopSlugs($mediaKits);
    }

    private function jerseyHasProductImage(Jersey $jersey): bool
    {
        if (filled($jersey->image)) {
            return true;
        }

        if ($jersey->relationLoaded('mediaAssets')) {
            return $jersey->mediaAssets->isNotEmpty();
        }

        return $jersey->mediaAssets()->exists();
    }

    /**
     * @param  list<array{id: string, name: string, image_url: string, slug: null}>  $kits
     * @return list<array{id: string, name: string, image_url: string, slug: string|null}>
     */
    private function enrichMediaKitsWithShopSlugs(array $kits): array
    {
        $slugByKey = [
            'kit_home' => Jersey::query()->active()->where('slug', 'like', '%-home-2526')->orderBy('id')->value('slug'),
            'kit_away' => Jersey::query()->active()->where('slug', 'like', '%-away-2526')->orderBy('id')->value('slug'),
            'kit_training' => Jersey::query()->active()->where('slug', 'like', '%-training-2526')->orderBy('id')->value('slug'),
        ];

        return array_map(function (array $kit) use ($slugByKey): array {
            $kit['slug'] = $slugByKey[$kit['id']] ?? null;

            return $kit;
        }, $kits);
    }
}
