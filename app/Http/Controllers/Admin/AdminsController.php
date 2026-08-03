<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use App\Services\Admin\RoleAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rules\Password;

class AdminsController extends Controller
{
    public function __construct(
        protected RoleAssignmentService $roleAssignments,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAdmins');

        $admins = User::role(User::ADMIN_ROLES)
            ->with('roles')
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->orderBy('name')
            ->paginate($request->per_page ?? 20);

        return response()->json($admins);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('manageAdmins');

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', Password::defaults()],
            'role' => 'required|string|in:'.implode(',', User::ADMIN_ROLES),
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $this->roleAssignments->assignRole($request->user(), $user, $data['role']);

        ActivityLog::record('admin.created', "Created admin {$user->email} with role {$data['role']}", $request->user()?->id);

        return response()->json(new AdminUserResource($user->load('roles')), 201);
    }

    public function show(User $admin): JsonResponse
    {
        Gate::authorize('viewAdmins');
        $this->ensureAdminAccount($admin);

        return response()->json(new AdminUserResource($admin->load('roles')));
    }

    public function update(Request $request, User $admin): JsonResponse
    {
        Gate::authorize('manageAdmins');
        $this->ensureAdminAccount($admin);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,'.$admin->id,
            'password' => ['sometimes', 'nullable', Password::defaults()],
            'role' => 'sometimes|string|in:'.implode(',', User::ADMIN_ROLES),
        ]);

        if (! empty($data['password'])) {
            $admin->update(['password' => $data['password']]);
            $admin->incrementTokenVersion();
        }

        $admin->update(collect($data)->except('password', 'role')->toArray());

        if (isset($data['role'])) {
            $this->roleAssignments->assignRole($request->user(), $admin, $data['role']);
        }

        ActivityLog::record('admin.updated', "Updated admin {$admin->email}", $request->user()?->id);

        return response()->json(new AdminUserResource($admin->fresh(['roles'])));
    }

    public function destroy(Request $request, User $admin): JsonResponse
    {
        Gate::authorize('manageAdmins');
        $this->ensureAdminAccount($admin);

        if ((int) $request->user()?->id === (int) $admin->id) {
            return response()->json(['message' => 'You cannot delete your own admin account.'], 422);
        }

        ActivityLog::record('admin.deleted', "Deleted admin {$admin->email}", $request->user()?->id);
        $admin->delete();

        return response()->json(['message' => 'Admin deleted.']);
    }

    public function roles(): JsonResponse
    {
        Gate::authorize('viewAdmins');

        return response()->json(Role::whereIn('name', User::ADMIN_ROLES)->get(['id', 'name']));
    }

    private function ensureAdminAccount(User $admin): void
    {
        abort_unless($admin->hasAnyRole(User::ADMIN_ROLES), 404);
    }
}
