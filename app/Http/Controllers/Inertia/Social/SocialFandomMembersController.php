<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Fandom;
use App\Services\Social\FandomHubService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SocialFandomMembersController extends Controller
{
    public function __invoke(Request $request, FandomHubService $hub): Response
    {
        $fandom = Fandom::query()->where('is_active', true)->orderBy('name')->first();

        if ($fandom === null) {
            throw new NotFoundHttpException('No active fandom.');
        }

        return Inertia::render('Social/Fandom/Members', [
            'fandom' => ['id' => $fandom->id, 'name' => $fandom->name],
            'members' => $hub->membersPage($fandom, $request->integer('page', 1)),
        ]);
    }
}
