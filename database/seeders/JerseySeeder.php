<?php

namespace Database\Seeders;

use App\Enums\JerseySize;
use App\Models\Club;
use App\Models\Jersey;
use App\Models\JerseyVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Idempotent kit catalog for the Social shop.
 *
 * Seeds home / away / third / training replicas for every club (≈4× club count),
 * plus one club-neutral terrace tee. With the standard ClubSeeder catalogue
 * (30 clubs) this yields 120+ active jerseys.
 *
 * Run alone after clubs exist:
 *   php artisan db:seed --class=JerseySeeder
 *
 * Not included in ProductionCoreSeeder (keeps production bootstrap lean).
 */
class JerseySeeder extends Seeder
{
    /**
     * Kit blueprints applied to every club.
     *
     * @var list<array{key: string, label: string, season: string, price: string, description: string, stock: int}>
     */
    private const KIT_BLUEPRINTS = [
        [
            'key' => 'home',
            'label' => 'Home',
            'season' => '25/26',
            'price' => '69.99',
            'description' => 'Official replica home jersey — confirm order, we ship without card rails on this pass.',
            'stock' => 28,
        ],
        [
            'key' => 'away',
            'label' => 'Away',
            'season' => '25/26',
            'price' => '74.99',
            'description' => 'Away replica with matchday travel fit. Shipping-only checkout on this pass.',
            'stock' => 24,
        ],
        [
            'key' => 'third',
            'label' => 'Third',
            'season' => '25/26',
            'price' => '79.99',
            'description' => 'Limited third kit — terrace-ready cut, size stock tracked per SKU.',
            'stock' => 18,
        ],
        [
            'key' => 'training',
            'label' => 'Training',
            'season' => '25/26',
            'price' => '54.99',
            'description' => 'Club training top for warm-ups and away days. Lightweight replica fabric.',
            'stock' => 32,
        ],
    ];

    public function run(): void
    {
        $clubs = $this->resolveClubs();

        foreach ($clubs as $club) {
            foreach (self::KIT_BLUEPRINTS as $kit) {
                $this->seedClubKit($club, $kit);
            }
        }

        $this->seedGenericTee();

        $this->command?->info(sprintf(
            'Jersey catalog ready: %d kits across %d clubs.',
            Jersey::query()->count(),
            $clubs->count(),
        ));
    }

    /**
     * @return Collection<int, Club>
     */
    private function resolveClubs(): Collection
    {
        $clubs = Club::query()->orderBy('id')->get();

        if ($clubs->isNotEmpty()) {
            return $clubs;
        }

        $this->call(ClubSeeder::class);

        $clubs = Club::query()->orderBy('id')->get();

        if ($clubs->isEmpty()) {
            $clubs = Club::factory()->count(2)->create();
        }

        return $clubs;
    }

    /**
     * @param  array{key: string, label: string, season: string, price: string, description: string, stock: int}  $kit
     */
    private function seedClubKit(Club $club, array $kit): void
    {
        $short = Str::slug($club->short ?: $club->name) ?: 'club';
        $slug = "{$short}-{$kit['key']}-2526";
        $name = trim("{$club->name} {$kit['label']} {$kit['season']}");

        $jersey = Jersey::query()->updateOrCreate(
            ['slug' => $slug],
            [
                'club_id' => $club->id,
                'name' => $name,
                'description' => $kit['description'],
                'price' => $kit['price'],
                'is_active' => true,
            ],
        );

        $this->seedVariants($jersey, $club, $kit['stock']);
    }

    private function seedGenericTee(): void
    {
        $generic = Jersey::query()->updateOrCreate(
            ['slug' => 'mad-fan-terrace-tee'],
            [
                'club_id' => null,
                'name' => 'Mad Fan Terrace Tee',
                'description' => 'Club-neutral training layer for matchday travel.',
                'price' => '39.99',
                'is_active' => true,
            ],
        );

        foreach ([JerseySize::S, JerseySize::M, JerseySize::L, JerseySize::Xl] as $size) {
            JerseyVariant::query()->updateOrCreate(
                [
                    'jersey_id' => $generic->id,
                    'size' => $size,
                ],
                [
                    'stock' => 40,
                    'sku' => 'MF-TEE-'.$size->value,
                ],
            );
        }
    }

    private function seedVariants(Jersey $jersey, Club $club, int $stock): void
    {
        $prefix = strtoupper(Str::limit($club->short ?: 'CLUB', 6, ''));

        foreach (JerseySize::cases() as $size) {
            JerseyVariant::query()->updateOrCreate(
                [
                    'jersey_id' => $jersey->id,
                    'size' => $size,
                ],
                [
                    'stock' => $stock,
                    'sku' => "{$prefix}-{$size->value}-{$jersey->id}",
                ],
            );
        }
    }
}
