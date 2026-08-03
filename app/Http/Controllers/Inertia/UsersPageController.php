<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\AdminPermission;
use App\Enums\StaffPosition;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\ActivityLog;
use App\Models\LoyaltyTier;
use App\Models\Role;
use App\Models\User;
use App\Services\Admin\AdminOrganizationContext;
use App\Services\Admin\FanProfileAnalyticsService;
use App\Services\Admin\ImpersonationService;
use App\Services\Staff\StaffAssignmentService;
use App\Support\SortableQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UsersPageController extends Controller
{
    public function __construct(
        private AdminOrganizationContext $organizationContext,
        private FanProfileAnalyticsService $analytics,
        private StaffAssignmentService $staffAssignments,
        private ImpersonationService $impersonation,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $query = $this->organizationContext->applyFanScope(
            User::query()->with('loyaltyTier', 'roles'),
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

        $users = $query->paginate($request->per_page ?? 20)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'sort_by', 'sort_dir']),
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'loyaltyTiers' => LoyaltyTier::query()->orderBy('display_order')->get(['id', 'name', 'code']),
            'staffPositions' => StaffPosition::options(),
            'can_create' => Gate::allows('create', User::class),
            'can_delete' => $request->user()?->can(AdminPermission::UsersDelete->value) ?? false,
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        $this->authorize('view', $user);

        $user->load([
            'loyaltyTier',
            'roles',
            'streak',
            'staffPositionAssignedBy:id,name,email',
            'socialAccounts',
        ]);

        return Inertia::render('Admin/Users/Show', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'handle' => $user->handle,
                'fan_id' => $user->fan_id,
                'country' => $user->country,
                'league' => $user->league,
                'club' => $user->club,
                'avatar_emoji' => $user->avatar_emoji,
                'avatar_url' => $user->avatar_url,
                'loyalty_tier_id' => $user->loyalty_tier_id,
                'loyalty_tier' => $user->loyaltyTier,
                'total_points' => (int) $user->total_points,
                'current_streak_days' => (int) $user->current_streak_days,
                'best_streak_days' => (int) $user->best_streak_days,
                'referral_count' => (int) $user->referral_count,
                'is_staff' => (bool) $user->is_staff,
                'staff_position' => $user->staff_position,
                'staff_status' => $user->staff_status,
                'roles' => $user->roles->pluck('name')->values()->all(),
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
                'social_accounts' => $user->socialAccounts->map(fn ($account): array => [
                    'platform' => $account->platform?->value ?? $account->platform,
                    'username' => $account->username,
                    'connected_at' => $account->connected_at?->toIso8601String(),
                ])->values()->all(),
            ],
            'staff_profile' => $this->staffAssignments->profileForUser($user),
            'analytics' => $this->analytics->forUser($user),
            'loyaltyTiers' => LoyaltyTier::query()->orderBy('display_order')->get(['id', 'name', 'code']),
            'staffPositions' => StaffPosition::options(),
            'can_edit' => Gate::allows('update', $user),
            'can_manage_staff' => Gate::allows('manageStaff', $user),
            'can_delete' => Gate::allows('delete', $user),
            'can_impersonate' => $this->impersonation->canImpersonate($request->user(), $user),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
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

        ActivityLog::record(
            'user.updated',
            "Updated user {$user->email} via Inertia admin",
            $request->user()?->id,
            ['user_id' => $user->id],
        );

        return redirect()
            ->route('admin.users.show', $user)
            ->with('success', 'User profile updated.');
    }
}
