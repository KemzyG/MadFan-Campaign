<?php

use App\Models\Channel;
use App\Models\Message;
use App\Services\Security\ChatMessageCipher;
use Illuminate\Support\Facades\DB;
use ParagonIE\Paseto\Exception\PasetoException;

test('message bodies are stored as PASETO ciphertext, not plaintext, at the database layer', function () {
    $user = socialReadyUser();
    $channel = Channel::factory()->create();

    $message = Message::factory()->create([
        'channel_id' => $channel->id,
        'author_id' => $user->id,
        'body' => 'this should never appear as plaintext in the database',
    ]);

    $raw = DB::table('messages')->where('id', $message->id)->value('body');

    expect($raw)->toStartWith('v3.local.')
        ->and($raw)->not->toContain('this should never appear as plaintext');
});

test('message bodies decrypt transparently through the Eloquent model', function () {
    $user = socialReadyUser();
    $channel = Channel::factory()->create();
    $plaintext = 'round-trips perfectly through the model';

    $message = Message::factory()->create([
        'channel_id' => $channel->id,
        'author_id' => $user->id,
        'body' => $plaintext,
    ]);

    $fresh = Message::query()->find($message->id);

    expect($fresh->body)->toBe($plaintext);
});

test('legacy plaintext rows written before encryption remain readable', function () {
    $user = socialReadyUser();
    $channel = Channel::factory()->create();

    $id = DB::table('messages')->insertGetId([
        'channel_id' => $channel->id,
        'author_id' => $user->id,
        'type' => 'text',
        'body' => 'plaintext from before this feature shipped',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $message = Message::query()->find($id);

    expect($message->body)->toBe('plaintext from before this feature shipped');
});

test('tampered ciphertext fails closed instead of returning corrupted plaintext', function () {
    $user = socialReadyUser();
    $channel = Channel::factory()->create();

    $message = Message::factory()->create([
        'channel_id' => $channel->id,
        'author_id' => $user->id,
        'body' => 'will be tampered with after storage',
    ]);

    $tampered = substr(DB::table('messages')->where('id', $message->id)->value('body'), 0, -4).'ABCD';
    DB::table('messages')->where('id', $message->id)->update(['body' => $tampered]);

    $reloaded = Message::query()->find($message->id);

    // The cast catches the PasetoException internally and degrades to a
    // placeholder rather than throwing through page rendering or leaking
    // ciphertext/partial plaintext.
    expect($reloaded->body)->toBe('[message unavailable]');
});

test('two messages with identical plaintext produce different ciphertext (random nonce)', function () {
    $cipher = app(ChatMessageCipher::class);

    $a = $cipher->encrypt('same message twice');
    $b = $cipher->encrypt('same message twice');

    expect($a)->not->toBe($b)
        ->and($cipher->decrypt($a))->toBe('same message twice')
        ->and($cipher->decrypt($b))->toBe('same message twice');
});

test('decrypting a non-PASETO string throws rather than returning garbage', function () {
    $cipher = app(ChatMessageCipher::class);

    expect(fn () => $cipher->decrypt('v3.local.not-actually-valid-ciphertext'))
        ->toThrow(PasetoException::class);
});

test('resolving the key outside local/testing without CHAT_ENCRYPTION_KEY fails loudly', function () {
    config(['services.paseto.chat_key' => null]);
    app()['env'] = 'production';

    try {
        expect(fn () => new ChatMessageCipher())->toThrow(
            RuntimeException::class,
            'CHAT_ENCRYPTION_KEY is not set.',
        );
    } finally {
        app()['env'] = 'testing';
    }
});
