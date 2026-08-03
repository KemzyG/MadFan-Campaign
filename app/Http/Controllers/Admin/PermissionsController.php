<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AdminPermission;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Permission;

class PermissionsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize(AdminPermission::RolesManage->value);
        $query = Permission::query()
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy('name');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize(AdminPermission::RolesManage->value);
        $validated = $request->validate([
            'name' => 'required|string|unique:permissions,name',
            'guard_name' => 'nullable|string',
        ]);

        $permission = Permission::create([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);

        ActivityLog::record('permission.created', "Created permission {$permission->name}");

        return response()->json($permission, 201);
    }

    public function show(Permission $permission): JsonResponse
    {
        Gate::authorize(AdminPermission::RolesManage->value);

        return response()->json($permission);
    }

    public function update(Request $request, Permission $permission): JsonResponse
    {
        Gate::authorize(AdminPermission::RolesManage->value);
        $validated = $request->validate([
            'name' => 'sometimes|string|unique:permissions,name,'.$permission->id,
            'guard_name' => 'sometimes|string',
        ]);

        $permission->update($validated);

        ActivityLog::record('permission.updated', "Updated permission {$permission->name}");

        return response()->json($permission);
    }

    public function destroy(Permission $permission): JsonResponse
    {
        Gate::authorize(AdminPermission::RolesManage->value);
        ActivityLog::record('permission.deleted', "Deleted permission {$permission->name}");
        $permission->delete();

        return response()->json(['message' => 'Permission deleted.']);
    }
}
