<?php

namespace App\Filament\Resources\Users\Actions;

use App\Models\User;
use App\Services\Staff\StaffAssignmentService;
use Filament\Actions\Action;
use Filament\Notifications\Notification;

class RemoveStaffPositionAction
{
    public static function make(): Action
    {
        return Action::make('removeStaffPosition')
            ->label('Remove Staff Position')
            ->icon('heroicon-o-user-minus')
            ->color('danger')
            ->visible(function (Action $action): bool {
                $record = $action->getRecord();

                return $record instanceof User && $record->is_staff;
            })
            ->requiresConfirmation()
            ->modalHeading('Remove staff position')
            ->modalDescription('This user will return to regular fan status and lose access to the staff dashboard.')
            ->action(function (StaffAssignmentService $staffAssignments, Action $action): void {
                $record = $action->getRecord();

                if (! $record instanceof User) {
                    return;
                }

                /** @var User $removedBy */
                $removedBy = auth()->user();

                $staffAssignments->remove($record, $removedBy);

                Notification::make()
                    ->title('Staff position removed')
                    ->success()
                    ->send();
            });
    }
}
