<?php

namespace App\Http\Controllers\Inertia\Fan;

use App\Http\Controllers\Controller;
use App\Services\Fan\FanPageDataService;
use App\Services\SocialAccountService;
use App\Support\ApplicationSettings;
use App\Support\SocialRouting;
use App\Support\SurfaceRedirect;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ConnectAccountsPageController extends Controller
{
    public function index(Request $request, SocialAccountService $socialAccounts, FanPageDataService $data): Response|SymfonyResponse
    {
        $user = $request->user();

        if (! ApplicationSettings::socialVerificationRequired()) {
            return SurfaceRedirect::to($request, SocialRouting::url('/'));
        }

        $onboarding = $request->boolean('onboarding') || $request->session()->get('onboarding_required', false);
        $manage = $request->boolean('manage');
        $connected = $data->connectedAccounts($request);
        $requiredComplete = $connected['required_accounts_complete'];

        if ($requiredComplete && ! $manage && ! $onboarding) {
            return SurfaceRedirect::to($request, SocialRouting::url('/'));
        }

        if ($requiredComplete && $onboarding) {
            $request->session()->forget('onboarding_required');
            $request->session()->flash('success', 'You\'re all set! Welcome to Mad Fan.');

            return SurfaceRedirect::intended($request, SocialRouting::url('/'));
        }

        return Inertia::render('Fan/ConnectAccounts', [
            ...$connected,
            'accounts' => $connected['connected_accounts'],
            'required_complete' => $requiredComplete,
            'missing_required' => $connected['missing_required_accounts'],
            'onboarding' => $onboarding,
            'fan' => $data->userHeader($request),
        ]);
    }
}
