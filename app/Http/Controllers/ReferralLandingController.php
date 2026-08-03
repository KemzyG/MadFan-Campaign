<?php

namespace App\Http\Controllers;

use App\Services\ReferralService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReferralLandingController extends Controller
{
    public function __invoke(Request $request, string $fanId, ReferralService $referralService): RedirectResponse
    {
        $referrer = $referralService->captureReferrer($fanId);

        if ($request->user()?->id === $referrer?->id) {
            $referralService->forgetReferrer();
        }

        if ($referrer && ! $request->user()) {
            return redirect()
                ->route('fan.campaign')
                ->with('success', "You were invited by {$referrer->name}. Join the waitlist or register to earn them points!");
        }

        if ($referrer) {
            return redirect()->route('fan.campaign');
        }

        return redirect()
            ->route('fan.campaign')
            ->with('error', 'That referral link is invalid.');
    }
}
