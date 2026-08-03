<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\AdminUserResource;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\Admin\AdminOrganizationContext;
use App\Services\Admin\FanProfileAnalyticsService;
use App\Services\Admin\RoleAssignmentService;
use App\Services\Staff\StaffAssignmentService;
use App\Services\Staff\StaffPerformanceService;
use App\Support\SortableQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsersController extends Controller
{
    public function __construct(
        protected StaffAssignmentService $staffAssignments,
        protected StaffPerformanceService $staffPerformance,
        protected RoleAssignmentService $roleAssignments,
        protected AdminOrganizationContext $organizationContext,
        protected FanProfileAnalyticsService $fanAnalytics,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = $this->organizationContext->applyFanScope(
            User::with('loyaltyTier', 'roles'),
        )
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%")
                    ->orWhere('username', 'like', "%{$request->search}%")
                    ->orWhere('fan_id', 'like', "%{$request->search}%");
            }))
            ->when($request->role, fn ($q) => $q->role($request->role));

        SortableQuery::apply(
            $query,
            $request->sort_by,
            $request->sort_dir,
            ['name', 'email', 'created_at', 'total_points', 'fan_id'],
        );

        return AdminUserResource::collection(
            $query->paginate($request->per_page ?? 20),
        )->response();
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        $user->load([
            'loyaltyTier',
            'roles',
            'staffPositionAssignedBy',
            'pointTransactions' => fn ($q) => $q->latest()->limit(20),
            'userTaskProgress.task',
            'streak',
            'referrals.referred',
            'assignedStaffTasks' => fn ($q) => $q->where('audience', 'staff')->orderBy('display_order'),
        ]);

        return response()->json([
            ...(new AdminUserResource($user))->resolve(),
            'staff_profile' => $this->staffAssignments->profileForUser($user),
            'staff_performance' => $this->staffPerformance->forUser($user),
            'analytics' => $this->fanAnalytics->forUser($user),
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $user = User::create([
            ...$request->safe()->except('role'),
            'password' => $request->password,
        ]);

        if ($request->role) {
            $this->roleAssignments->assignRole($request->user(), $user, $request->role);
        }

        ActivityLog::record('user.created', "Created user {$user->email}", $request->user()?->id, ['user_id' => $user->id]);

        return response()->json(new AdminUserResource($user->load(['loyaltyTier', 'roles'])), 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $data = $request->safe()->except(['password', 'total_points']);

        if ($request->filled('password')) {
            $data['password'] = $request->password;
            $user->incrementTokenVersion();
        }

        $user->update($data);

        if ($request->has('total_points')) {
            $user->forceFill(['total_points' => $request->integer('total_points')])->save();
        }

        ActivityLog::record('user.updated', "Updated user {$user->email}", $request->user()?->id, ['user_id' => $user->id]);

        return response()->json(new AdminUserResource($user->fresh(['loyaltyTier', 'roles'])));
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        ActivityLog::record('user.deleted', "Deleted user {$user->email}", auth()->id(), ['user_id' => $user->id]);
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    public function assignRole(Request $request, User $user): JsonResponse
    {
        $this->authorize('assignRole', $user);

        $request->validate(['role' => 'required|string|exists:roles,name']);

        $this->roleAssignments->assignRole($request->user(), $user, $request->string('role')->toString());

        ActivityLog::record('user.role_assigned', "Assigned role {$request->role} to {$user->email}", $request->user()?->id);

        return response()->json(['message' => 'Role assigned.', 'roles' => $user->fresh()->getRoleNames()]);
    }
}
