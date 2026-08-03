<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Admin\ImpersonationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ImpersonationController extends Controller
{
    public function __construct(
        private ImpersonationService $impersonation,
    ) {}

    public function start(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();
        abort_unless($actor instanceof User, 403);
        abort_unless($this->impersonation->canImpersonate($actor, $user), 403);

        $this->impersonation->start($actor, $user, $request);

        return redirect()
            ->to($this->impersonation->redirectUrlFor($user))
            ->with('success', "Now viewing as {$user->name}.");
    }

    public function stop(Request $request): RedirectResponse
    {
        abort_unless($this->impersonation->isImpersonating($request), 403);

        $impersonator = $this->impersonation->stop($request);

        return redirect()
            ->route('admin.dashboard')
            ->with('success', "Returned to {$impersonator->name}.");
    }
}
