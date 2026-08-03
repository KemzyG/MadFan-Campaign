<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ActivityLogsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewActivityLogs');
        $query = ActivityLog::with('user:id,name,email')
            ->when($request->event, fn ($q) => $q->where('event', 'like', "%{$request->event}%"))
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->date_from, fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->per_page ?? 50));
    }
}
