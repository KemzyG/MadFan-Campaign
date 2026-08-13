<?php

namespace Database\Seeders;

use App\Enums\JerseySize;
use App\Models\Club;
use App\Models\Jersey;
use App\Models\JerseyVariant;
use Illuminate\Database\Seeder;

class JerseySeeder extends Seeder
{
    public function run(): void
    {
        $clubs = Club::query()->orderBy('id')->take(3)->get();

        if ($clubs->isEmpty()) {
            $clubs = Club::factory()->count(2)->create();
        }

        foreach ($clubs as $index => $club) {
            $jersey = Jersey::query()->firstOrCreate(
                ['slug' => str($club->short ?: $club->name)->slug().'-home-2526'],
                [
                    'club_id' => $club->id,
                    'name' => $club->name.' Home 25/26',
                    'description' => 'Official replica home jersey — confirm order, we ship without card rails on this pass.',
                    'price' => $index === 0 ? '69.99' : '74.99',
                    'is_active' => true,
                ],
            );

            foreach (JerseySize::cases() as $size) {
                JerseyVariant::query()->firstOrCreate(
                    [
                        'jersey_id' => $jersey->id,
                        'size' => $size,
                    ],
                    [
                        'stock' => 25,
                        'sku' => strtoupper(($club->short ?: 'CLUB').'-'.$size->value.'-'.$jersey->id),
                    ],
                );
            }
        }

        $generic = Jersey::query()->firstOrCreate(
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
            JerseyVariant::query()->firstOrCreate(
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
}
