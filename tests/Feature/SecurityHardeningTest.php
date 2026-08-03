<?php

use App\Models\User;
use App\Services\PasetoService;
use App\Services\TelegramLoginService;
use App\Support\SortableQuery;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    $this->withoutMiddleware(PreventRequestForgery::class);
});

test('sortable query ignores invalid sort columns', function () {
    $query = User::query();

    SortableQuery::apply($query, 'password_hash', 'desc', ['name', 'email', 'created_at'], 'created_at', 'desc');

    expect($query->toSql())->toContain('order by "created_at" desc');
});

test('telegram rejects unsigned auth payloads by default', function () {
    $service = app(TelegramLoginService::class);

    expect($service->verifyAuthData(['id' => 12345]))->toBeFalse();
});

test('support admin cannot assign super-admin role', function () {
    $support = createSupportAdmin();
    $target = createUser();

    $this->actingAs($support)
        ->postJson('/app/api/users/'.$target->id.'/assign-role', ['role' => 'super-admin'])
        ->assertForbidden();
});

test('support admin cannot delete users', function () {
    $support = createSupportAdmin();
    $target = createUser();

    $this->actingAs($support)
        ->deleteJson('/app/api/users/'.$target->id)
        ->assertForbidden();
});

test('login route is rate limited', function () {
    RateLimiter::clear('login');

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->post('/app/login', [
            'email' => 'missing@example.com',
            'password' => 'wrong-password',
        ]);
    }

    $this->post('/app/login', [
        'email' => 'missing@example.com',
        'password' => 'wrong-password',
    ])->assertStatus(429);
});

test('paseto token is revoked after logout', function () {
    $user = createUser();
    $token = app(PasetoService::class)->generateToken($user->id);

    $this->withHeaders(['Authorization' => 'Bearer '.$token])
        ->getJson('/api/me')
        ->assertSuccessful();

    $this->withHeaders(['Authorization' => 'Bearer '.$token])
        ->postJson('/api/logout')
        ->assertSuccessful();

    $this->withHeaders(['Authorization' => 'Bearer '.$token])
        ->getJson('/api/me')
        ->assertUnauthorized();
});

test('security headers are present on web responses', function () {
    $response = $this->get('/');

    $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('Content-Security-Policy');
    expect($response->headers->get('Content-Security-Policy'))->toContain("default-src 'self'");
});

test('admin cannot assign super-admin without being super-admin', function () {
    $admin = createAdminUser();
    $target = createUser();

    $this->actingAs($admin)
        ->postJson('/app/api/users/'.$target->id.'/assign-role', ['role' => 'super-admin'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['role']);
});

test('super-admin can assign super-admin role', function () {
    seedRoles();
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('super-admin');
    $target = createUser();

    $this->actingAs($superAdmin)
        ->postJson('/app/api/users/'.$target->id.'/assign-role', ['role' => 'super-admin'])
        ->assertSuccessful();

    expect($target->fresh()->hasRole('super-admin'))->toBeTrue();
});
