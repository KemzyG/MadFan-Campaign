<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AdminPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingRequest;
use App\Models\ActivityLog;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize(AdminPermission::SettingsView->value);

        return response()->json(Setting::orderBy('key')->get());
    }

    public function update(UpdateSettingRequest $request): JsonResponse
    {
        Gate::authorize(AdminPermission::SettingsUpdate->value);

        foreach ($request->validated('settings') as $item) {
            Setting::updateOrCreate(
                ['key' => $item['key']],
                ['value' => $item['value'], 'description' => $item['description'] ?? null, 'type' => $item['type'] ?? 'text']
            );
        }

        ActivityLog::record('settings.updated', 'Admin updated application settings', $request->user()?->id);

        return response()->json(['message' => 'Settings saved.', 'settings' => Setting::orderBy('key')->get()]);
    }

    public function storeSingle(UpdateSettingRequest $request): JsonResponse
    {
        Gate::authorize(AdminPermission::SettingsUpdate->value);

        $validated = $request->validate([
            'key' => 'required|string',
            'value' => 'nullable|string',
            'description' => 'nullable|string',
            'type' => 'nullable|in:text,boolean,integer,json',
        ]);

        $setting = Setting::updateOrCreate(['key' => $validated['key']], $validated);

        ActivityLog::record('setting.updated', "Updated setting {$validated['key']}", $request->user()?->id);

        return response()->json($setting);
    }
}
