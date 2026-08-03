<?php

namespace App\Http\Controllers\Inertia\Fan;

use App\Http\Controllers\Controller;
use App\Services\Fan\FanPageDataService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardPageController extends Controller
{
    public function __invoke(Request $request, FanPageDataService $data): Response
    {
        return Inertia::render('Fan/Dashboard', [
            ...$data->dashboard($request),
            'fan' => $data->userHeader($request),
        ]);
    }
}
