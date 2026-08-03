<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class AdminMfaService
{
    public function __construct(private Google2FA $google2fa = new Google2FA) {}

    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey(32);
    }

    public function qrCodeUrl(User $user, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl(
            (string) config('app.name', 'Mad Fan'),
            (string) $user->email,
            $secret,
        );
    }

    public function verify(string $secret, string $code): bool
    {
        return $this->google2fa->verifyKey($secret, $code, 1);
    }

    /**
     * @return list<string>
     */
    public function generateRecoveryCodes(int $count = 8): array
    {
        return Collection::times($count, fn () => Str::lower(Str::random(4).'-'.Str::random(4)))
            ->values()
            ->all();
    }

    public function storePendingSecret(User $user, string $secret): void
    {
        $user->forceFill([
            'mfa_secret' => Crypt::encryptString($secret),
            'mfa_confirmed_at' => null,
            'mfa_recovery_codes' => null,
        ])->save();
    }

    /**
     * @param  list<string>  $recoveryCodes
     */
    public function confirm(User $user, array $recoveryCodes): void
    {
        $user->forceFill([
            'mfa_confirmed_at' => now(),
            'mfa_recovery_codes' => Crypt::encryptString(json_encode(
                array_map(fn (string $code) => password_hash($code, PASSWORD_BCRYPT), $recoveryCodes),
            )),
        ])->save();
    }

    public function decryptSecret(User $user): ?string
    {
        if (blank($user->mfa_secret)) {
            return null;
        }

        try {
            return Crypt::decryptString((string) $user->mfa_secret);
        } catch (\Throwable) {
            return null;
        }
    }

    public function consumeRecoveryCode(User $user, string $code): bool
    {
        if (blank($user->mfa_recovery_codes)) {
            return false;
        }

        try {
            /** @var list<string> $hashes */
            $hashes = json_decode(Crypt::decryptString((string) $user->mfa_recovery_codes), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return false;
        }

        $matched = false;
        $remaining = [];

        foreach ($hashes as $hash) {
            if (! $matched && password_verify($code, $hash)) {
                $matched = true;

                continue;
            }

            $remaining[] = $hash;
        }

        if (! $matched) {
            return false;
        }

        $user->forceFill([
            'mfa_recovery_codes' => Crypt::encryptString(json_encode(array_values($remaining))),
        ])->save();

        return true;
    }

    public function disable(User $user): void
    {
        $user->forceFill([
            'mfa_secret' => null,
            'mfa_confirmed_at' => null,
            'mfa_recovery_codes' => null,
        ])->save();
    }
}
