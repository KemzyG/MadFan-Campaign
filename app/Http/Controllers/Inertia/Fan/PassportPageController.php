<?php

namespace App\Http\Controllers\Inertia\Fan;

use App\Http\Controllers\Controller;
use App\Http\Controllers\PassportController;
use App\Http\Requests\UpdatePassportRequest;
use App\Services\Fan\FanPageDataService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PassportPageController extends Controller
{
    public function index(Request $request, FanPageDataService $data): Response
    {
        return Inertia::render('Fan/Passport', [
            ...$data->passport($request),
            'fan' => $data->userHeader($request),
        ]);
    }

    public function update(UpdatePassportRequest $request): RedirectResponse
    {
        app(PassportController::class)->update($request);

        return redirect()->route('fan.passport')->with('success', 'Passport saved.');
    }
}
