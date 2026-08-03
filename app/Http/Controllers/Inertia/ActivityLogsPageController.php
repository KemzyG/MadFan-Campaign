<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewActivityLogs');

        $logs = ActivityLog::query()
            ->with('user:id,name,email')
            ->when($request->event, fn ($q) => $q->where('event', 'like', "%{$request->event}%"))
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->date_from, fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 50)
            ->withQueryString();

        return Inertia::render('Admin/ActivityLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['event', 'user_id', 'date_from', 'date_to']),
        ]);
    }
}
