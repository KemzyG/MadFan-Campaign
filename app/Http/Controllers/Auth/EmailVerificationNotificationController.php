<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\SocialRouting;
use App\Support\SurfaceRedirect;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class EmailVerificationNotificationController extends Controller
{
    public function store(Request $request): SymfonyResponse
    {
        if ($request->user()?->hasVerifiedEmail()) {
            return SurfaceRedirect::intended($request, SocialRouting::url('/'));
        }

        $request->user()?->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }
}
