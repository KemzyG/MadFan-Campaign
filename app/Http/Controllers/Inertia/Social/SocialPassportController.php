<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\SocialPassportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialPassportController extends Controller
{
    public function __invoke(Request $request, SocialPassportService $socialPassport): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('Social/Passport', [
            ...$socialPassport->present($user),
            'collections' => $socialPassport->collections($user),
        ]);
    }
}
