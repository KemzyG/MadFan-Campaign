<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;

class RegistrationIdentityGuard
{
    public const ERROR_KEY = 'registration';

    /**
     * Normalize email for uniqueness (lowercase + Gmail alias collapsing).
     */
    public function normalizeEmail(string $email): string
    {
        $email = Str::lower(trim($email));
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');

        if ($domain === '') {
            return $email;
        }

        if (in_array($domain, ['gmail.com', 'googlemail.com'], true)) {
            $local = Str::before($local, '+');
            $local = str_replace('.', '', $local);
            $domain = 'gmail.com';
        } else {
            $local = Str::before($local, '+');
        }

        return $local.'@'.$domain;
    }

    /**
     * Stable server-side hash of the client device fingerprint.
     */
    public function hashFingerprint(?string $rawFingerprint): ?string
    {
        if (! is_string($rawFingerprint)) {
            return null;
        }

        $rawFingerprint = trim($rawFingerprint);

        if (strlen($rawFingerprint) < 16) {
            return null;
        }

        return hash_hmac('sha256', $rawFingerprint, (string) config('app.key'));
    }

    /**
     * Whether one-account-per-identity enforcement is live for this request.
     *
     * Off in local so a developer who already registered on this machine isn't
     * locked out of the signup flow by their own lock cookie / fingerprint / IP.
     * The `testing` environment keeps it on, so the hardening suite is unaffected.
     */
    public function enforcementActive(): bool
    {
        if (app()->environment('local')) {
            return false;
        }

        return (bool) config('registration.enforce_one_account', true);
    }

    /**
     * @throws ValidationException
     */
    public function assertCanRegister(Request $request, string $email): void
    {
        if (! $this->enforcementActive()) {
            return;
        }

        $this->assertNoRegistrationLockCookie($request);
        $this->assertNormalizedEmailAvailable($email);

        $fingerprintHash = $this->hashFingerprint($request->input('device_fingerprint'));

        if (config('registration.require_fingerprint', true) && $fingerprintHash === null) {
            throw ValidationException::withMessages([
                'device_fingerprint' => 'We could not verify this device. Enable cookies/storage and try again, or use the browser where you already registered.',
            ]);
        }

        if (config('registration.unique_fingerprint', true) && $fingerprintHash !== null) {
            $this->assertFingerprintAvailable($fingerprintHash);
        }

        if (config('registration.unique_ip', true)) {
            $this->assertIpAvailable($request->ip());
        }
    }

    /**
     * Persist identity signals and return attributes for User::create.
     *
     * @return array{email_normalized: string, registration_fingerprint: ?string, registration_ip: ?string, registration_user_agent: ?string}
     */
    public function identityAttributes(Request $request, string $email): array
    {
        return [
            'email_normalized' => $this->normalizeEmail($email),
            'registration_fingerprint' => $this->hashFingerprint($request->input('device_fingerprint')),
            'registration_ip' => $request->ip(),
            'registration_user_agent' => Str::limit((string) $request->userAgent(), 1000, ''),
        ];
    }

    public function makeLockCookie(User $user): SymfonyCookie
    {
        $minutes = max(1, (int) config('registration.lock_cookie_days', 3650)) * 24 * 60;
        $name = (string) config('registration.lock_cookie', 'mf_reg_lock');

        return Cookie::make(
            name: $name,
            value: Crypt::encryptString(json_encode([
                'user_id' => $user->id,
                'fan_id' => $user->fan_id,
                'issued_at' => now()->timestamp,
            ], JSON_THROW_ON_ERROR)),
            minutes: $minutes,
            path: '/',
            secure: app()->environment('production'),
            httpOnly: true,
            sameSite: 'lax',
        );
    }

    public function hasRegistrationLock(Request $request): bool
    {
        return $this->lockedUserId($request) !== null;
    }

    public function lockedUserId(Request $request): ?int
    {
        $name = (string) config('registration.lock_cookie', 'mf_reg_lock');
        $raw = $request->cookie($name);

        if (! is_string($raw) || $raw === '') {
            return null;
        }

        try {
            $payload = json_decode(Crypt::decryptString($raw), true);
        } catch (\Throwable) {
            return null;
        }

        if (! is_array($payload) || ! isset($payload['user_id'])) {
            return null;
        }

        $userId = (int) $payload['user_id'];

        return User::query()->whereKey($userId)->exists() ? $userId : null;
    }

    /**
     * @throws ValidationException
     */
    protected function assertNoRegistrationLockCookie(Request $request): void
    {
        if ($this->hasRegistrationLock($request)) {
            throw ValidationException::withMessages([
                self::ERROR_KEY => 'This device already has a Mad Fan account. Sign in instead of creating another one.',
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    protected function assertNormalizedEmailAvailable(string $email): void
    {
        $normalized = $this->normalizeEmail($email);

        $exists = User::query()
            ->where(function ($query) use ($email, $normalized): void {
                $query->where('email', $email)
                    ->orWhere('email_normalized', $normalized);
            })
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'email' => 'Unable to create an account with this information. Enter campaign if you already have an account, or try another email.',
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    protected function assertFingerprintAvailable(string $fingerprintHash): void
    {
        if (User::query()->where('registration_fingerprint', $fingerprintHash)->exists()) {
            throw ValidationException::withMessages([
                self::ERROR_KEY => 'This device already has a Mad Fan account. Sign in instead of creating another one.',
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    protected function assertIpAvailable(?string $ip): void
    {
        if (! filled($ip)) {
            return;
        }

        $query = User::query()->where('registration_ip', $ip);

        $lookbackHours = config('registration.ip_lookback_hours');

        if ($lookbackHours !== null && $lookbackHours !== '' && (int) $lookbackHours > 0) {
            $query->where('created_at', '>=', now()->subHours((int) $lookbackHours));
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                self::ERROR_KEY => 'An account was already created from this network. Sign in with your existing Mad Fan account.',
            ]);
        }
    }
}
