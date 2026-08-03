<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\AdminPermission;
use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\UserTaskProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FailedVerificationsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize(AdminPermission::UsersView->value);

        $query = UserTaskProgress::query()
            ->failedVerification()
            ->with([
                'user:id,name,email,fan_id,handle',
                'task:id,code,name,platform,points',
            ])
            ->when($request->search, function ($query) use ($request): void {
                $search = (string) $request->search;
                $query->where(function ($query) use ($search): void {
                    $query->where('external_handle', 'like', "%{$search}%")
                        ->orWhere('failure_reason', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($userQuery) => $userQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('fan_id', 'like', "%{$search}%")
                            ->orWhere('handle', 'like', "%{$search}%"))
                        ->orWhereHas('task', fn ($taskQuery) => $taskQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%"));
                });
            })
            ->when($request->platform, fn ($query) => $query->whereHas(
                'task',
                fn ($taskQuery) => $taskQuery->where('platform', $request->platform),
            ))
            ->when($request->task_id, fn ($query) => $query->where('task_id', $request->task_id))
            ->when($request->user_id, fn ($query) => $query->where('user_id', $request->user_id))
            ->when($request->date_from, fn ($query) => $query->whereDate('failed_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($query) => $query->whereDate('failed_at', '<=', $request->date_to))
            ->orderByDesc('failed_at');

        $failedCount = UserTaskProgress::query()->failedVerification()->count();

        return Inertia::render('Admin/FailedVerifications/Index', [
            'verifications' => $query->paginate($request->integer('per_page', 20))->withQueryString(),
            'failed_count' => $failedCount,
            'filters' => $request->only(['search', 'platform', 'task_id', 'user_id', 'date_from', 'date_to']),
            'platforms' => ['x', 'twitter', 'discord', 'telegram', 'general'],
            'tasks' => Task::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
        ]);
    }
}
