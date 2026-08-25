<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Http\Requests\Social\UpdateSocialProfileRequest;
use App\Models\User;
use App\Support\CloudinaryImageStorage;
use Illuminate\Http\RedirectResponse;

class SocialProfileSettingsController extends Controller
{
    public function __invoke(UpdateSocialProfileRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        $fields = array_filter(
            array_intersect_key($data, array_flip(['name', 'handle', 'bio'])),
            fn ($value) => $value !== null,
        );

        if ($request->hasFile('avatar')) {
            $fields['avatar_path'] = CloudinaryImageStorage::replace(
                $user->avatar_path,
                $request->file('avatar'),
                'avatars',
            );
        }

        if ($fields !== []) {
            $user->update($fields);
        }

        return redirect()->route('social.you')->with('success', 'Profile updated.');
    }
}
