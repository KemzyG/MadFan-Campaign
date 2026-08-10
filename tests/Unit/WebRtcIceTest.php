<?php

use App\Support\WebRtcIce;
use Tests\TestCase;

uses(TestCase::class);

test('webrtc ice includes public turn fallback by default', function () {
    config([
        'webrtc.stun_urls' => ['stun:stun.l.google.com:19302'],
        'webrtc.turn_urls' => [],
        'webrtc.turn_username' => null,
        'webrtc.turn_credential' => null,
        'webrtc.use_public_turn_fallback' => true,
        'webrtc.public_turn' => [
            'urls' => [
                'turn:openrelay.metered.ca:80',
            ],
            'username' => 'openrelayproject',
            'credential' => 'openrelayproject',
        ],
    ]);

    expect(WebRtcIce::hasTurn())->toBeTrue();

    $servers = WebRtcIce::servers();
    expect($servers)->toHaveCount(2)
        ->and($servers[0]['urls'])->toBe('stun:stun.l.google.com:19302')
        ->and($servers[1]['username'])->toBe('openrelayproject')
        ->and($servers[1]['urls'])->toContain('turn:openrelay.metered.ca:80');
});

test('custom turn replaces public fallback', function () {
    config([
        'webrtc.stun_urls' => ['stun:stun.l.google.com:19302'],
        'webrtc.turn_urls' => ['turn:turn.example.test:3478', 'turns:turn.example.test:443'],
        'webrtc.turn_username' => 'user',
        'webrtc.turn_credential' => 'pass',
        'webrtc.use_public_turn_fallback' => true,
    ]);

    $servers = WebRtcIce::servers();

    expect(WebRtcIce::hasTurn())->toBeTrue()
        ->and($servers)->toHaveCount(2)
        ->and($servers[1]['urls'])->toBe(['turn:turn.example.test:3478', 'turns:turn.example.test:443'])
        ->and($servers[1]['username'])->toBe('user')
        ->and($servers[1]['credential'])->toBe('pass');
});

test('disabling public turn leaves stun only when no custom turn', function () {
    config([
        'webrtc.stun_urls' => ['stun:stun.l.google.com:19302'],
        'webrtc.turn_urls' => [],
        'webrtc.turn_username' => null,
        'webrtc.turn_credential' => null,
        'webrtc.use_public_turn_fallback' => false,
    ]);

    expect(WebRtcIce::hasTurn())->toBeFalse()
        ->and(WebRtcIce::servers())->toBe([
            ['urls' => 'stun:stun.l.google.com:19302'],
        ]);
});
