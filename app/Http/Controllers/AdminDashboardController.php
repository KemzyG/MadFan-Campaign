<?php

namespace App\Http\Controllers;

use App\Services\Admin\AdminDashboardDataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request, AdminDashboardDataService $dashboard): Response
    {
        Gate::authorize('viewDashboard');

        return Inertia::render('Admin/Dashboard', $dashboard->dataFor(
            $request->user(),
            $request->integer('days', 14),
        ));
    }
}
