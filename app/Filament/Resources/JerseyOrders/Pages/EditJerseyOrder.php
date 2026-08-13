<?php

namespace App\Filament\Resources\JerseyOrders\Pages;

use App\Enums\JerseyOrderStatus;
use App\Filament\Resources\JerseyOrders\JerseyOrderResource;
use Filament\Resources\Pages\EditRecord;

class EditJerseyOrder extends EditRecord
{
    protected static string $resource = JerseyOrderResource::class;

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeSave(array $data): array
    {
        $status = JerseyOrderStatus::from($data['status']);

        if ($status === JerseyOrderStatus::Confirmed) {
            $data['confirmed_at'] = $this->record->confirmed_at ?? now();
        }

        if ($status === JerseyOrderStatus::Fulfilled) {
            $data['confirmed_at'] = $this->record->confirmed_at ?? now();
            $data['fulfilled_at'] = $this->record->fulfilled_at ?? now();
        }

        if ($status === JerseyOrderStatus::Cancelled) {
            $data['fulfilled_at'] = null;
        }

        return $data;
    }

    protected function getHeaderActions(): array
    {
        return [];
    }
}
