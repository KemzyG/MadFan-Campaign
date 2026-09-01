<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\SocialReportStatus;
use App\Http\Controllers\Controller;
use App\Models\SocialReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReportsPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageReports');

        $reports = SocialReport::query()
            ->with(['reporter:id,name,email', 'assignee:id,name,email'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->latest()
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/Reports/Index', [
            'reports' => $reports,
            'filters' => [
                'status' => $request->string('status')->toString() ?: null,
            ],
            'statuses' => array_map(fn (SocialReportStatus $status) => $status->value, SocialReportStatus::cases()),
        ]);
    }
}
