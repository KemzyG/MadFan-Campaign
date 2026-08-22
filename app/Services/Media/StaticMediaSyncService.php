<?php

namespace App\Services\Media;

use App\Services\Fan\LandingMediaService;
use App\Services\Social\StageMediaService;

class StaticMediaSyncService
{
    public function __construct(
        private LandingMediaService $landingMedia,
        private StageMediaService $stageMedia,
    ) {}

    /**
     * Sync every configured static media catalog.
     *
     * @return array<string, list<array{key: string, storage: string, url: string, public_id: ?string, action: string}>>
     */
    public function sync(bool $overwrite = false): array
    {
        $catalogs = config('media.catalogs', []);
        $results = [];

        if (array_key_exists('landing', $catalogs)) {
            $results['landing'] = $this->landingMedia->sync($overwrite);
        }

        if (array_key_exists('stage', $catalogs)) {
            $results['stage'] = $this->stageMedia->sync($overwrite);
        }

        return $results;
    }
}
