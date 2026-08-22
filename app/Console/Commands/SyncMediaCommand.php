<?php

namespace App\Console\Commands;

use App\Services\Media\StaticMediaSyncService;
use Illuminate\Console\Command;
use Throwable;

class SyncMediaCommand extends Command
{
    protected $signature = 'madfan:sync-media
                            {--fresh : Overwrite Cloudinary public_ids even when source PNGs are unchanged}';

    protected $description = 'Sync committed Mad Fan static media to Cloudinary (missing/changed only) or public/landing-media';

    public function handle(StaticMediaSyncService $staticMedia): int
    {
        $overwrite = (bool) $this->option('fresh');

        $this->info($overwrite
            ? 'Force-syncing Mad Fan static media…'
            : 'Syncing Mad Fan static media (upload only when missing or changed)…');

        try {
            $catalogResults = $staticMedia->sync($overwrite);
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $uploaded = 0;
        $skipped = 0;
        $updated = 0;

        foreach ($catalogResults as $catalog => $results) {
            $label = (string) config("media.catalogs.{$catalog}.label", $catalog);
            $this->newLine();
            $this->line("<fg=cyan>{$label}</>");

            foreach ($results as $result) {
                $action = (string) ($result['action'] ?? 'uploaded');

                if ($action === 'skipped') {
                    $skipped++;
                } elseif ($action === 'updated') {
                    $updated++;
                } else {
                    $uploaded++;
                }

                $this->line(sprintf(
                    '  [%s/%s] %s → %s',
                    $result['storage'],
                    $action,
                    $result['key'],
                    $result['url'],
                ));
            }
        }

        $this->newLine();
        $this->info("Done. {$uploaded} uploaded, {$updated} updated, {$skipped} skipped.");
        $this->line('Re-run with --fresh after changing committed source PNGs to force Cloudinary overwrite.');

        return self::SUCCESS;
    }
}
