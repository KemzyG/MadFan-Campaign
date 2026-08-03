<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RolesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Role::class);
        $query = Role::query()
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy('name');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Role::class);
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name',
            'guard_name' => 'nullable|string',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);

        if (! empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        ActivityLog::record('role.created', "Created role {$role->name}");

        return response()->json($role->load('permissions'), 201);
    }

    public function show(Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        return response()->json($role->load('permissions'));
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $this->authorize('update', $role);
        $validated = $request->validate([
            'name' => 'sometimes|string|unique:roles,name,'.$role->id,
            'guard_name' => 'sometimes|string',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role->update(collect($validated)->only(['name', 'guard_name'])->toArray());

        if (array_key_exists('permissions', $validated)) {
            $role->syncPermissions($validated['permissions'] ?? []);
        }

        ActivityLog::record('role.updated', "Updated role {$role->name}");

        return response()->json($role->fresh('permissions'));
    }

    public function destroy(Role $role): JsonResponse
    {
        $this->authorize('delete', $role);
        ActivityLog::record('role.deleted', "Deleted role {$role->name}");
        $role->delete();

        return response()->json(['message' => 'Role deleted.']);
    }
}
