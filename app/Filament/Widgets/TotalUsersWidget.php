<?php

namespace App\Filament\Widgets;

use App\Models\User;
use Filament\Widgets\Widget;

class TotalUsersWidget extends Widget
{
    protected string $view = 'filament.widgets.total-users';

    protected function getViewData(): array
    {
        return [
            'total' => User::count(),
        ];
    }
}
