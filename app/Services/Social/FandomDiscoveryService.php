<?php

namespace App\Services\Social;

use App\Models\Fandom;
use App\Models\FandomFollow;
use App\Models\FandomSubset;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * The Fandom browse/discovery page: pill filters, popular fandoms, the
 * explore-by-category grid, and what's trending right now. Separate from
 * FandomHubService, which presents the inside of one already-chosen fandom.
 */
class FandomDiscoveryService
{
    /**
     * @var array<string, string>
     */
    private const GROUPS = [
        'sports' => 'Sports',
        'music' => 'Music',
        'books' => 'Books',
        'esports' => 'Esports',
    ];

    /**
     * The pill row: "All" plus every group that actually has a fandom in it,
     * in a fixed, deliberate order rather than alphabetical.
     *
     * @return list<array{key: string, label: string, active: bool}>
     */
    public function presentGroups(?string $activeGroup): array
    {
        $present = Fandom::query()
            ->where('is_active', true)
            ->whereNotNull('group')
            ->distinct()
            ->pluck('group');

        $groups = collect(['all' => 'All'])
            ->merge(collect(self::GROUPS)->only($present->all()))
            ->map(fn (string $label, string $key): array => [
                'key' => $key,
                'label' => $label,
                'active' => ($activeGroup ?: 'all') === $key,
            ])
            ->values()
            ->all();

        return $groups;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentPopular(?User $viewer, ?string $group, int $limit = 8): array
    {
        return $this->scopedFandoms($group)
            ->orderByDesc(
                FandomFollow::query()->selectRaw('count(*)')
                    ->whereColumn('fandom_id', 'fandoms.id'),
            )
            ->limit($limit)
            ->get()
            ->map(fn (Fandom $fandom): array => $this->presentFandomCard($fandom, $viewer))
            ->all();
    }

    /**
     * The "Explore by Category" grid — every active fandom with how many
     * subsets sit under it, regardless of follow popularity.
     *
     * @return list<array<string, mixed>>
     */
    public function presentCategories(?string $group): array
    {
        return $this->scopedFandoms($group)
            ->withCount('subsets')
            ->orderBy('name')
            ->get()
            ->map(fn (Fandom $fandom): array => [
                'id' => $fandom->id,
                'name' => $fandom->name,
                'slug' => $fandom->slug,
                'icon' => $fandom->icon,
                'subset_count' => $fandom->subsets_count,
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentTrending(int $limit = 8): array
    {
        return FandomSubset::query()
            ->where('is_trending', true)
            ->with('fandom:id,name,slug,icon')
            ->orderByDesc('fan_count')
            ->limit($limit)
            ->get()
            ->map(fn (FandomSubset $subset): array => $this->presentSubsetCard($subset))
            ->all();
    }

    /**
     * @return array{fandoms: list<array<string, mixed>>, subsets: list<array<string, mixed>>}
     */
    public function search(string $query, User $viewer): array
    {
        $query = trim($query);

        if ($query === '') {
            return ['fandoms' => [], 'subsets' => []];
        }

        $fandoms = Fandom::query()
            ->where('is_active', true)
            ->where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->limit(10)
            ->get()
            ->map(fn (Fandom $fandom): array => $this->presentFandomCard($fandom, $viewer))
            ->all();

        $subsets = FandomSubset::query()
            ->where('name', 'like', "%{$query}%")
            ->with('fandom:id,name,slug,icon')
            ->orderByDesc('fan_count')
            ->limit(10)
            ->get()
            ->map(fn (FandomSubset $subset): array => $this->presentSubsetCard($subset))
            ->all();

        return ['fandoms' => $fandoms, 'subsets' => $subsets];
    }

    /**
     * @return Builder<Fandom>
     */
    private function scopedFandoms(?string $group)
    {
        return Fandom::query()
            ->where('is_active', true)
            ->when($group && $group !== 'all', fn ($q) => $q->where('group', $group));
    }

    /**
     * @return array<string, mixed>
     */
    private function presentFandomCard(Fandom $fandom, ?User $viewer): array
    {
        return [
            'id' => $fandom->id,
            'name' => $fandom->name,
            'slug' => $fandom->slug,
            'icon' => $fandom->icon,
            'cover_image_url' => $fandom->cover_image_url,
            'fan_count' => FandomFollow::query()->where('fandom_id', $fandom->id)->count(),
            'is_following' => $viewer !== null && $viewer->isFollowingFandom($fandom),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentSubsetCard(FandomSubset $subset): array
    {
        return [
            'id' => $subset->id,
            'name' => $subset->name,
            'slug' => $subset->slug,
            'image_url' => $subset->image_url,
            'fan_count' => $subset->fan_count,
            'fandom' => $subset->fandom ? [
                'name' => $subset->fandom->name,
                'slug' => $subset->fandom->slug,
                'icon' => $subset->fandom->icon,
            ] : null,
        ];
    }
}
