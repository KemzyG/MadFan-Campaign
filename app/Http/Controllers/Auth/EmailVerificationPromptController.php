<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\SocialRouting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        if (! config('auth.email_verification_enabled') || $request->user()?->hasVerifiedEmail()) {
            return redirect()->intended(SocialRouting::url('/'));
        }

        return Inertia::render('Fan/Auth/VerifyEmail', [
            'status' => $request->session()->get('status'),
        ]);
    }
}
