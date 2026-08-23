<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\SocialRouting;
use App\Support\SurfaceRedirect;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class VerifyEmailController extends Controller
{
    public function __invoke(EmailVerificationRequest $request): SymfonyResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return SurfaceRedirect::intended($request, SocialRouting::url('/'));
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
        }

        $request->session()->flash('success', 'Email verified. Welcome to Mad Fan.');

        return SurfaceRedirect::intended($request, SocialRouting::url('/'));
    }
}
