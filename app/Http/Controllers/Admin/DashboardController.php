<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDashboardDataService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DashboardController extends Controller
{
    public function __invoke(Request $request, AdminDashboardDataService $dashboard): JsonResponse
    {
        Gate::authorize('viewDashboard');

        return response()->json($dashboard->dataFor($request->user()));
    }
}
