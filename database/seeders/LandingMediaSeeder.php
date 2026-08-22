<?php

namespace Database\Seeders;

use App\Services\Fan\LandingMediaService;
use Illuminate\Database\Seeder;
use Throwable;

class LandingMediaSeeder extends Seeder
{
    /**
     * Publish landing images to Cloudinary (preferred) or public/landing-media.
     * Safe to re-run — uploads only missing or changed assets unless forced.
     */
    public function run(LandingMediaService $landingMedia): void
    {
        try {
            $results = $landingMedia->sync(overwrite: false);
        } catch (Throwable $exception) {
            $this->command?->error('Landing media sync failed: '.$exception->getMessage());

            return;
        }

        $cloud = collect($results)->where('storage', 'cloudinary')->count();
        $local = collect($results)->where('storage', 'local')->count();

        $this->command?->info("Landing media synced: {$cloud} on Cloudinary, {$local} local publish.");
    }
}
