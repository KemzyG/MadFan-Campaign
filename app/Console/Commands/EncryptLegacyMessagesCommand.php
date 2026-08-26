<?php

namespace App\Console\Commands;

use App\Services\Security\ChatMessageCipher;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * One-off backfill: re-saves any message body still stored as plaintext
 * (written before chat encryption shipped) so it's encrypted at rest too.
 * Safe to run repeatedly — already-encrypted rows are skipped — and safe to
 * skip entirely, since the read path already handles legacy plaintext
 * transparently; this only tightens at-rest protection for old history.
 */
class EncryptLegacyMessagesCommand extends Command
{
    protected $signature = 'madfan:encrypt-legacy-messages
                            {--chunk=500 : Rows to process per batch}';

    protected $description = 'Re-encrypt any chat message bodies still stored as plaintext from before encryption was enabled';

    public function handle(ChatMessageCipher $cipher): int
    {
        $chunkSize = max(1, (int) $this->option('chunk'));
        $total = 0;

        DB::table('messages')
            ->select(['id', 'body'])
            ->whereNotNull('body')
            ->where('body', '!=', '')
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use ($cipher, &$total): void {
                foreach ($rows as $row) {
                    if ($cipher->looksEncrypted($row->body)) {
                        continue;
                    }

                    // Direct column update, not Message::save() — avoids
                    // touching updated_at/edited_at or firing model events
                    // for what is purely an at-rest storage format change.
                    DB::table('messages')
                        ->where('id', $row->id)
                        ->update(['body' => $cipher->encrypt($row->body)]);

                    $total++;
                }
            });

        $this->info("Encrypted {$total} legacy plaintext message(s).");

        return self::SUCCESS;
    }
}
