<?php

namespace App\Filament\Resources\MatchFixtures\Pages;

use App\Filament\Resources\MatchFixtures\MatchFixtureResource;
use App\Services\Social\PredictionService;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditMatchFixture extends EditRecord
{
    protected static string $resource = MatchFixtureResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }

    /**
     * Marking a fixture Finished with both scores set resolves its linked
     * prediction (if any) right here — no separate "settle" action to
     * remember, no scheduled job.
     */
    protected function afterSave(): void
    {
        $fixture = $this->record->fresh();
        $prediction = $fixture->prediction;

        if ($prediction !== null) {
            app(PredictionService::class)->resolve($prediction);
        }
    }
}
