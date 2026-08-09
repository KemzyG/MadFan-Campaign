<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SocialFollowController extends Controller
{
    public function store(Request $request, User $user): RedirectResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        if ($viewer->id === $user->id) {
            throw ValidationException::withMessages([
                'user' => 'You cannot follow yourself.',
            ]);
        }

        Follow::query()->firstOrCreate(
            [
                'follower_id' => $viewer->id,
                'following_id' => $user->id,
            ],
            [
                'created_at' => now(),
            ],
        );

        return back()->with('success', 'Following '.$user->name.'.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        Follow::query()
            ->where('follower_id', $viewer->id)
            ->where('following_id', $user->id)
            ->delete();

        return back()->with('success', 'Unfollowed '.$user->name.'.');
    }
}
