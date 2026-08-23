<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\WalletService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialWalletController extends Controller
{
    public function __invoke(Request $request, WalletService $wallet): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('Social/Wallet/Index', $wallet->present($user));
    }
}
