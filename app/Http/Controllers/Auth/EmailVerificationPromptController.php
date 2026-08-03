<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        return $request->user()?->hasVerifiedEmail()
            ? redirect()->intended(route('fan.dashboard'))
            : Inertia::render('Fan/Auth/VerifyEmail', [
                'status' => $request->session()->get('status'),
            ]);
    }
}
