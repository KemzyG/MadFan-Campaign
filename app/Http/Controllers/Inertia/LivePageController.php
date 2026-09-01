<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminLiveOpsService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LivePageController extends Controller
{
    public function __invoke(AdminLiveOpsService $liveOps): Response
    {
        Gate::authorize('viewDashboard');

        return Inertia::render('Admin/Live/Index', $liveOps->pageData());
    }
}
