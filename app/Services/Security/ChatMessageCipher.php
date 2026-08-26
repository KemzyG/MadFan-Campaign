<?php

namespace App\Services\Security;

use ParagonIE\Paseto\Exception\PasetoException;
use ParagonIE\Paseto\Keys\Version3\SymmetricKey;
use ParagonIE\Paseto\Protocol\Version3;
use Random\RandomException;

/**
 * Encrypts/decrypts chat message bodies at rest using PASETO v3.local
 * (AES-256-CTR + HMAC-SHA384 AEAD, authenticated + tamper-evident).
 *
 * This is encryption AT REST, not end-to-end encryption: the server holds
 * the key and can read message content — that's required for moderation,
 * point-award validation, and notification snippets elsewhere in the app.
 * A database leak alone does not expose plaintext.
 *
 * Deliberately a separate key from {@see \App\Services\PasetoService} (auth
 * tokens): rotating or compromising one must never affect the other.
 */
class ChatMessageCipher
{
    private const PREFIX = 'v3.local.';

    private SymmetricKey $key;

    public function __construct()
    {
        $this->key = $this->resolveKey();
    }

    public function encrypt(string $plaintext): string
    {
        return Version3::encrypt($plaintext, $this->key);
    }

    /**
     * @throws PasetoException on a corrupt, truncated, or wrong-key ciphertext
     */
    public function decrypt(string $ciphertext): string
    {
        return Version3::decrypt($ciphertext, $this->key);
    }

    /**
     * Distinguishes ciphertext from legacy plaintext rows written before
     * encryption was enabled, so existing message history keeps rendering
     * without a mandatory backfill migration.
     */
    public function looksEncrypted(string $value): bool
    {
        return str_starts_with($value, self::PREFIX);
    }

    private function resolveKey(): SymmetricKey
    {
        $configured = config('services.paseto.chat_key');

        if (is_string($configured) && $configured !== '') {
            $raw = base64_decode($configured, true);

            if ($raw === false) {
                throw new \RuntimeException('CHAT_ENCRYPTION_KEY is not valid base64.');
            }

            return new SymmetricKey($raw);
        }

        return new SymmetricKey($this->devFallbackKeyMaterial());
    }

    /**
     * Local-development convenience only. Persists a generated key to local
     * disk so it survives between requests on a single machine — but every
     * app instance that never sets CHAT_ENCRYPTION_KEY generates its OWN key,
     * so this must never be relied on in production: messages encrypted by
     * one instance become permanently undecryptable on another, or after any
     * redeploy that doesn't preserve storage/app/.
     */
    private function devFallbackKeyMaterial(): string
    {
        $path = storage_path('app/chat_encryption.key');

        if (! is_file($path)) {
            logger()->warning(
                'CHAT_ENCRYPTION_KEY is not configured; generating a local-only chat encryption key at '
                    .$path.'. Set CHAT_ENCRYPTION_KEY in production (identical across every app instance) '
                    .'or chat history will not survive a redeploy or a second server.',
            );

            try {
                $material = random_bytes(Version3::getSymmetricKeyByteLength());
            } catch (RandomException $exception) {
                throw new \RuntimeException('Unable to generate a chat encryption key.', previous: $exception);
            }

            file_put_contents($path, $material, LOCK_EX);
            chmod($path, 0600);

            return $material;
        }

        return (string) file_get_contents($path);
    }
}
