<?php

namespace App\Casts;

use App\Services\Security\ChatMessageCipher;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use ParagonIE\Paseto\Exception\PasetoException;

/**
 * Transparent at-rest encryption for a text column: encrypts on write,
 * decrypts on read, via {@see ChatMessageCipher}. Every existing call site
 * that reads `$message->body` keeps working unchanged — the ciphertext never
 * leaves the model boundary.
 *
 * @implements CastsAttributes<string|null, string|null>
 */
class ChatEncryptedText implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        $cipher = app(ChatMessageCipher::class);

        // Legacy plaintext written before encryption was enabled — render as
        // stored rather than force a backfill migration before this can ship.
        if (! $cipher->looksEncrypted($value)) {
            return $value;
        }

        try {
            return $cipher->decrypt($value);
        } catch (PasetoException $exception) {
            report($exception);

            return '[message unavailable]';
        }
    }

    public function set($model, string $key, $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        return app(ChatMessageCipher::class)->encrypt((string) $value);
    }
}
