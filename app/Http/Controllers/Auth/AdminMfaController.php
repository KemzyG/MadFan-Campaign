<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AdminMfaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminMfaController extends Controller
{
    public function __construct(private AdminMfaService $mfa) {}

    public function setup(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User || (! $user->canAccessInertiaAdmin() && ! $user->hasRole('super-admin'))) {
            abort(403);
        }

        if ($user->hasMfaEnabled() && $request->session()->get('admin_mfa_passed') === true) {
            return redirect()->route('admin.dashboard');
        }

        $secret = $this->mfa->decryptSecret($user);

        if ($secret === null || $user->hasMfaEnabled()) {
            $secret = $this->mfa->generateSecret();
            $this->mfa->storePendingSecret($user, $secret);
        }

        return Inertia::render('Auth/MfaSetup', [
            'otpauth_url' => $this->mfa->qrCodeUrl($user, $secret),
            'secret' => $secret,
        ]);
    }

    public function confirmSetup(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $secret = $this->mfa->decryptSecret($user);

        if ($secret === null || ! $this->mfa->verify($secret, $validated['code'])) {
            throw ValidationException::withMessages([
                'code' => 'That authentication code is invalid.',
            ]);
        }

        $recoveryCodes = $this->mfa->generateRecoveryCodes();
        $this->mfa->confirm($user, $recoveryCodes);

        $request->session()->put('admin_mfa_passed', true);
        $request->session()->flash('mfa_recovery_codes', $recoveryCodes);

        return redirect()
            ->route('admin.dashboard')
            ->with('success', 'Two-factor authentication is enabled.');
    }

    public function challenge(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->hasMfaEnabled()) {
            return redirect()->route('admin.mfa.setup');
        }

        if ($request->session()->get('admin_mfa_passed') === true) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Auth/MfaChallenge');
    }

    public function verifyChallenge(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->hasMfaEnabled()) {
            return redirect()->route('admin.mfa.setup');
        }

        $validated = $request->validate([
            'code' => ['required', 'string'],
        ]);

        $secret = $this->mfa->decryptSecret($user);
        $code = preg_replace('/\s+/', '', $validated['code']) ?? '';

        $passed = ($secret !== null && strlen($code) === 6 && $this->mfa->verify($secret, $code))
            || $this->mfa->consumeRecoveryCode($user, strtolower($code));

        if (! $passed) {
            throw ValidationException::withMessages([
                'code' => 'That authentication code is invalid.',
            ]);
        }

        $request->session()->put('admin_mfa_passed', true);

        return redirect()->intended(route('admin.dashboard'));
    }
}
