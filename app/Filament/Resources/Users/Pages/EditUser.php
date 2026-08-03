<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\Actions\AssignStaffPositionAction;
use App\Filament\Resources\Users\Actions\RemoveStaffPositionAction;
use App\Filament\Resources\Users\UserResource;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            AssignStaffPositionAction::make(),
            RemoveStaffPositionAction::make(),
            DeleteAction::make(),
        ];
    }

    protected function afterActionCalled(Action $action): void
    {
        parent::afterActionCalled($action);

        $this->record->refresh()->load('staffPositionAssignedBy');
    }
}
