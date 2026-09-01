<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SocialReportStatus;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SocialReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ReportsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageReports');

        $reports = SocialReport::query()
            ->with(['reporter:id,name,email', 'assignee:id,name,email'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('target_type'), fn ($query) => $query->where('target_type', $request->string('target_type')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($reports);
    }

    public function show(SocialReport $report): JsonResponse
    {
        Gate::authorize('manageReports');

        return response()->json($report->load(['reporter:id,name,email,username', 'assignee:id,name,email']));
    }

    public function update(Request $request, SocialReport $report): JsonResponse
    {
        Gate::authorize('manageReports');

        $data = $request->validate([
            'status' => ['required', Rule::enum(SocialReportStatus::class)],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $report->update($data);

        ActivityLog::record('report.updated', "Updated report #{$report->id} to {$report->status->value}");

        return response()->json($report->fresh()->load(['reporter:id,name,email', 'assignee:id,name,email']));
    }

    public function destroy(SocialReport $report): JsonResponse
    {
        Gate::authorize('manageReports');

        ActivityLog::record('report.deleted', "Deleted report #{$report->id}");
        $report->delete();

        return response()->json(['message' => 'Report deleted.']);
    }

    public function store(Request $request): JsonResponse
    {
        abort(405);
    }
}
