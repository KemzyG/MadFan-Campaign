<?php

use App\Support\MaskedEmail;
use Database\Seeders\SeasonSeeder;

test('users api index does not expose sensitive registration fields', function () {
    $admin = createAdminUser();
    $fan = createUser([
        'email' => 'secret-fan@madfan.test',
        'registration_fingerprint' => 'abc123fingerprint',
        'registration_ip' => '203.0.113.10',
        'registration_user_agent' => 'SecretAgent/1.0',
        'firebase_uid' => 'firebase-secret',
    ]);

    $this->actingAs($admin)
        ->getJson('/app/api/users?search='.urlencode($fan->email))
        ->assertSuccessful()
        ->assertJsonMissing(['registration_fingerprint' => 'abc123fingerprint'])
        ->assertJsonMissing(['registration_ip' => '203.0.113.10'])
        ->assertJsonMissing(['firebase_uid' => 'firebase-secret'])
        ->assertJsonMissingPath('data.0.password_hash')
        ->assertJsonPath('data.0.email', 'secret-fan@madfan.test');
});

test('public leaderboard hides other users names', function () {
    $this->seed(SeasonSeeder::class);

    createUser(['total_points' => 5000, 'name' => 'Hidden Leader', 'email' => 'mikeu@gmail.com']);
    $viewer = createUser(['total_points' => 10, 'name' => 'Viewer Self']);

    $this->withHeaders(pasetoHeaders($viewer))
        ->getJson('/api/leaderboard?limit=5')
        ->assertSuccessful()
        ->assertJsonPath('entries.0.user.email_masked', MaskedEmail::from('mikeu@gmail.com'))
        ->assertJsonPath('entries.0.user.name', null)
        ->assertJsonPath('current_user.user.name', 'Viewer Self');
});
