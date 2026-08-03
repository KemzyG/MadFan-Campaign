<?php

use App\Models\User;

test('guests cannot access protected endpoints', function () {
    $this->getJson('/api/me')->assertUnauthorized();
});

test('users can register and receive a paseto token', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Test Fan',
        'email' => 'fan@example.com',
        'username' => 'testfan',
        'password' => validTestPassword(),
        'password_confirmation' => validTestPassword(),
        'device_fingerprint' => deviceFingerprint('api-register-1'),
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['token', 'user' => ['id', 'email', 'fan_id']]);

    expect(User::where('email', 'fan@example.com')->exists())->toBeTrue();
});

test('users can login with valid credentials', function () {
    $user = createUser([
        'email' => 'login@example.com',
        'password_hash' => bcrypt(validTestPassword()),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'login@example.com',
        'password' => validTestPassword(),
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonStructure(['token']);
});

test('login rejects invalid credentials', function () {
    createUser(['email' => 'login@example.com']);

    $this->postJson('/api/login', [
        'email' => 'login@example.com',
        'password' => 'wrong-password',
    ])->assertUnprocessable();
});

test('authenticated users can fetch their profile', function () {
    $user = createUser();

    $this->withHeaders(pasetoHeaders($user))
        ->getJson('/api/me')
        ->assertSuccessful()
        ->assertJsonPath('user.id', $user->id);
});

test('authenticated users can logout', function () {
    $user = createUser();

    $this->withHeaders(pasetoHeaders($user))
        ->postJson('/api/logout')
        ->assertSuccessful()
        ->assertJsonPath('message', 'Logged out successfully.');
});
