<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\AdminPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateApplicationSettingsRequest;
use App\Models\ActivityLog;
use App\Support\ApplicationSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SettingsPageController extends Controller
{
    public function index(): Response
    {
        Gate::authorize(AdminPermission::SettingsView->value);

        return Inertia::render('Admin/Settings/Index', [
            'segments' => ApplicationSettings::groupedForAdmin(),
        ]);
    }

    public function update(UpdateApplicationSettingsRequest $request): RedirectResponse
    {
        Gate::authorize(AdminPermission::SettingsUpdate->value);

        ApplicationSettings::sync(
            ApplicationSettings::validatePayload($request->all()),
        );

        ActivityLog::record('settings.updated', 'Admin updated application settings via Inertia panel');

        return redirect()->route('admin.settings')->with('success', 'Settings saved successfully.');
    }
}
