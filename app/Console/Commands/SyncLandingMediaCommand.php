<?php

namespace App\Console\Commands;

use App\Services\Fan\LandingMediaService;
use Illuminate\Console\Command;
use Throwable;

class SyncLandingMediaCommand extends Command
{
    protected $signature = 'madfan:sync-landing-media {--fresh : Overwrite existing Cloudinary public_ids}';

    protected $description = 'Push Mad Fan landing page images to Cloudinary (stable public_ids) or public/landing-media';

    public function handle(LandingMediaService $landingMedia): int
    {
        $this->info('Syncing Mad Fan landing media…');

        try {
            $results = $landingMedia->sync(overwrite: true);
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        foreach ($results as $result) {
            $this->line(sprintf(
                '  [%s] %s → %s',
                $result['storage'],
                $result['key'],
                $result['url'],
            ));
        }

        $this->newLine();
        $this->info('Done. Cloudinary assets keep the same public_ids across deploys; re-run this command after changing source PNGs.');

        return self::SUCCESS;
    }
}
