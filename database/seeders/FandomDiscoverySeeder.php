<?php

namespace Database\Seeders;

use App\Models\Fandom;
use App\Models\FandomSubset;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo content for the Fandom discovery/browse page: categories beyond the
 * bootstrap "Football" row (see create_sports_table), each with a handful of
 * subsets (leagues, games, genres — whatever the category's unit is). Purely
 * showcase data — nothing here is a functional dependency the way Football
 * itself is for club/league/leaderboard code.
 */
class FandomDiscoverySeeder extends Seeder
{
    public function run(): void
    {
        $football = Fandom::query()->where('slug', 'football')->first();

        if ($football !== null) {
            $football->forceFill(['group' => 'sports', 'icon' => '⚽'])->save();
            $this->subsets($football, [
                ['name' => 'Premier League'],
                ['name' => 'La Liga'],
                ['name' => 'Serie A'],
                ['name' => 'Bundesliga'],
                ['name' => 'Ligue 1'],
                ['name' => 'El Clasico', 'is_trending' => true],
            ]);
        }

        $categories = [
            ['name' => 'Esports', 'group' => 'esports', 'icon' => '🎮', 'subsets' => [
                ['name' => 'VALORANT', 'is_trending' => true],
                ['name' => 'League of Legends'],
                ['name' => 'Counter-Strike 2'],
                ['name' => 'Dota 2'],
            ]],
            ['name' => 'Cricket', 'group' => 'sports', 'icon' => '🏏', 'subsets' => [
                ['name' => 'India vs Australia', 'is_trending' => true],
                ['name' => 'IPL'],
                ['name' => 'ICC World Cup'],
                ['name' => 'The Ashes'],
                ['name' => 'Big Bash League'],
            ]],
            ['name' => 'Rugby', 'group' => 'sports', 'icon' => '🏈', 'subsets' => [
                ['name' => 'Six Nations'],
                ['name' => 'Rugby World Cup'],
                ['name' => 'Premiership Rugby'],
            ]],
            ['name' => 'Tennis', 'group' => 'sports', 'icon' => '🎾', 'subsets' => [
                ['name' => 'ATP Tour'],
                ['name' => 'WTA Tour'],
                ['name' => 'Grand Slams'],
            ]],
            ['name' => 'F1', 'group' => 'sports', 'icon' => '🏁', 'subsets' => [
                ['name' => 'F1 2025 Season', 'is_trending' => true],
                ['name' => 'Constructors Championship'],
                ['name' => 'Drivers Championship'],
            ]],
            ['name' => 'Music', 'group' => 'music', 'icon' => '🎧', 'subsets' => [
                ['name' => 'Pop'],
                ['name' => 'Hip-Hop'],
                ['name' => 'Rock'],
                ['name' => 'Afrobeats'],
            ]],
            ['name' => 'Books', 'group' => 'books', 'icon' => '📖', 'subsets' => [
                ['name' => 'Fiction'],
                ['name' => 'Fantasy'],
                ['name' => 'Non-Fiction'],
            ]],
        ];

        foreach ($categories as $category) {
            $fandom = Fandom::query()->firstOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'description' => null,
                    'is_active' => true,
                    'group' => $category['group'],
                    'icon' => $category['icon'],
                ],
            );

            $fandom->forceFill(['group' => $category['group'], 'icon' => $category['icon']])->save();

            $this->subsets($fandom, $category['subsets']);
        }
    }

    /**
     * @param  list<array{name: string, is_trending?: bool}>  $subsets
     */
    private function subsets(Fandom $fandom, array $subsets): void
    {
        foreach ($subsets as $index => $subset) {
            FandomSubset::query()->updateOrCreate(
                ['fandom_id' => $fandom->id, 'slug' => Str::slug($fandom->slug.'-'.$subset['name'])],
                [
                    'name' => $subset['name'],
                    'fan_count' => random_int(800, 25000),
                    'is_trending' => $subset['is_trending'] ?? false,
                    'sort_order' => $index,
                ],
            );
        }
    }
}
