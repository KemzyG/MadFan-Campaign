<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDashboardDataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MePageController extends Controller
{
    public function __invoke(Request $request, AdminDashboardDataService $dashboard): Response
    {
        Gate::authorize('viewDashboard');

        return Inertia::render('Admin/Me/Index', $dashboard->personalDeskDataFor($request->user()));
    }
}
