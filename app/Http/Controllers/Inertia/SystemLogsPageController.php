<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Admin\SystemLogsController;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SystemLogsPageController extends Controller
{
    public function index(Request $request, SystemLogsController $logs): Response
    {
        Gate::authorize('viewSystemLogs');

        $response = $logs->index($request);
        $data = $response->getData(true);

        return Inertia::render('Admin/SystemLogs/Index', [
            'logData' => $data,
            'lines' => (int) ($request->lines ?? 200),
        ]);
    }
}
