<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Support\AdminWorkspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminProfilePageController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Admin/Profile/Edit', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames()->values()->all(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
            ],
            'workspace' => AdminWorkspace::for($user),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'current_password' => ['nullable', 'required_with:password', 'string'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        if (! empty($data['password'])) {
            if (! Hash::check((string) ($data['current_password'] ?? ''), $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => 'Current password is incorrect.',
                ]);
            }

            $user->password = $data['password'];
            $user->incrementTokenVersion();
        }

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->save();

        ActivityLog::record('admin.profile.updated', "Updated own admin profile {$user->email}", $user->id);

        return redirect()
            ->route('admin.profile')
            ->with('success', 'Profile updated.');
    }
}
