<?php

namespace App\Filament\Resources\Users\Actions;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Models\User;
use App\Services\Staff\StaffAssignmentService;
use Filament\Actions\Action;
use Filament\Forms\Components\Select;
use Filament\Notifications\Notification;

class AssignStaffPositionAction
{
    public static function make(): Action
    {
        return Action::make('assignStaffPosition')
            ->label(function (Action $action): string {
                $record = $action->getRecord();

                return ($record instanceof User && $record->is_staff)
                    ? 'Update Staff Position'
                    : 'Assign Staff Position';
            })
            ->icon('heroicon-o-identification')
            ->modalHeading(function (Action $action): string {
                $record = $action->getRecord();

                return ($record instanceof User && $record->is_staff)
                    ? 'Update staff position'
                    : 'Assign staff position';
            })
            ->modalSubmitActionLabel('Save')
            ->form([
                Select::make('staff_position')
                    ->label('Staff position')
                    ->options(collect(StaffPosition::cases())->mapWithKeys(
                        fn (StaffPosition $position): array => [$position->value => $position->label()]
                    )->all())
                    ->default(function (Action $action): ?string {
                        $record = $action->getRecord();

                        return $record instanceof User ? $record->staff_position : null;
                    })
                    ->required(),
                Select::make('staff_status')
                    ->label('Status')
                    ->options(collect(StaffStatus::cases())->mapWithKeys(
                        fn (StaffStatus $status): array => [$status->value => $status->label()]
                    )->all())
                    ->default(function (Action $action): string {
                        $record = $action->getRecord();

                        return $record instanceof User && filled($record->staff_status)
                            ? $record->staff_status
                            : StaffStatus::Active->value;
                    })
                    ->required(),
            ])
            ->action(function (array $data, StaffAssignmentService $staffAssignments, Action $action): void {
                $record = $action->getRecord();

                if (! $record instanceof User) {
                    return;
                }

                /** @var User $assignedBy */
                $assignedBy = auth()->user();
                $position = StaffPosition::from($data['staff_position']);
                $status = StaffStatus::from($data['staff_status']);

                if ($record->is_staff) {
                    $updated = $staffAssignments->updatePosition($record, $position, $assignedBy);

                    if ($status->value !== $updated->staff_status) {
                        $staffAssignments->setStatus($updated, $status, $assignedBy);
                    }
                } else {
                    $staffAssignments->assign($record, $position, $assignedBy, $status);
                }

                Notification::make()
                    ->title('Staff position saved')
                    ->success()
                    ->send();
            });
    }
}
