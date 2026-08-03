<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAdmins');

        $admins = User::role(User::ADMIN_ROLES)
            ->with('roles')
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->orderBy('name')
            ->paginate($request->per_page ?? 20)
            ->withQueryString();

        return Inertia::render('Admin/Admins/Index', [
            'admins' => $admins,
            'adminRoles' => Role::query()->whereIn('name', User::ADMIN_ROLES)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search']),
            'can_manage' => Gate::allows('manageAdmins'),
        ]);
    }
}
