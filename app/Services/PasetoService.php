<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use ParagonIE\Paseto\Builder;
use ParagonIE\Paseto\Keys\Version3\SymmetricKey;
use ParagonIE\Paseto\Parser;
use ParagonIE\Paseto\Protocol\Version3;

class PasetoService
{
    protected SymmetricKey $symmetricKey;

    protected int $ttlMinutes;

    public function __construct()
    {
        $this->ttlMinutes = max(5, (int) config('services.paseto.ttl_minutes', 60 * 24));

        $keyPath = storage_path('app/paseto_symmetric.key');

        if (! file_exists($keyPath)) {
            $key = Version3::generateSymmetricKey();
            file_put_contents($keyPath, $key->raw());
        }

        $this->symmetricKey = new SymmetricKey(file_get_contents($keyPath));
    }

    /**
     * Create a Paseto token for the given user ID.
     */
    public function generateToken(int $userId, array $customClaims = []): string
    {
        $user = User::query()->find($userId);
        $tokenVersion = $user?->token_version ?? 1;

        $now = Carbon::now();
        $builder = Builder::getLocal($this->symmetricKey)
            ->setIssuer(config('app.url'))
            ->setSubject((string) $userId)
            ->setIssuedAt($now)
            ->setExpiration($now->copy()->addMinutes($this->ttlMinutes))
            ->set('tv', $tokenVersion);

        foreach ($customClaims as $key => $value) {
            $builder->setClaim($key, $value);
        }

        return $builder->toString();
    }

    /**
     * Validate a token and return the user ID if valid.
     */
    public function validateToken(string $token): ?int
    {
        try {
            $payload = Parser::getLocal($this->symmetricKey)->parse($token);
            $subject = $payload->getSubject();

            if ($subject === null) {
                return null;
            }

            $userId = (int) $subject;
            $user = User::query()->find($userId);

            if (! $user) {
                return null;
            }

            $tokenVersion = $payload->get('tv');
            $expectedVersion = $user->token_version ?? 1;

            if ($tokenVersion === null || (int) $tokenVersion !== (int) $expectedVersion) {
                return null;
            }

            return $userId;
        } catch (\Exception) {
            return null;
        }
    }
}
