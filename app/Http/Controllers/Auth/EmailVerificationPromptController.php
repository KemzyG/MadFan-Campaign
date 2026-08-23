<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\SocialRouting;
use App\Support\SurfaceRedirect;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class EmailVerificationPromptController extends Controller
{
    public function __invoke(Request $request): Response|SymfonyResponse
    {
        if (! config('auth.email_verification_enabled') || $request->user()?->hasVerifiedEmail()) {
            return SurfaceRedirect::intended($request, SocialRouting::url('/'));
        }

        return Inertia::render('Fan/Auth/VerifyEmail', [
            'status' => $request->session()->get('status'),
        ]);
    }
}
