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
        $overwrite = (bool) $this->option('fresh');

        $this->info($overwrite
            ? 'Force-syncing Mad Fan landing media…'
            : 'Syncing Mad Fan landing media (upload only when missing or changed)…');

        try {
            $results = $landingMedia->sync($overwrite);
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        foreach ($results as $result) {
            $this->line(sprintf(
                '  [%s/%s] %s → %s',
                $result['storage'],
                $result['action'] ?? 'uploaded',
                $result['key'],
                $result['url'],
            ));
        }

        $this->newLine();
        $this->info('Done. Use madfan:sync-media to sync all static catalogs, or --fresh to force overwrite.');

        return self::SUCCESS;
    }
}
