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
    $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
    $response->assertHeader('Content-Security-Policy');
    expect($response->headers->get('Content-Security-Policy'))->toContain("default-src 'self'");
    expect($response->headers->get('Content-Security-Policy'))
        ->toMatch('/connect-src[^;]*https:/')
        ->and($response->headers->get('Content-Security-Policy'))->toMatch('/connect-src[^;]*wss:/');
    expect($response->headers->get('Permissions-Policy'))
        ->toContain('microphone=(self)')
        ->and($response->headers->get('Permissions-Policy'))->not->toContain('microphone=*')
        ->and($response->headers->get('Permissions-Policy'))->not->toContain('microphone=()');
});

test('non-local CSP does not allow vite development origins', function () {
    $csp = $this->get('/')->headers->get('Content-Security-Policy');

    expect($csp)
        ->toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
        ->and($csp)->toContain("worker-src 'self' blob:")
        ->and($csp)->not->toContain(':5173')
        ->and($csp)->not->toContain(':5174')
        ->and($csp)->not->toContain('ws://')
        ->and($csp)->not->toContain('[::1]');
});

test('local CSP allows the vite hot origin for hmr', function () {
    app()->detectEnvironment(fn (): string => 'local');

    $hotPath = public_path('hot');
    $previousHot = is_file($hotPath) ? file_get_contents($hotPath) : null;
    file_put_contents($hotPath, "http://127.0.0.1:5174\n");

    try {
        $csp = $this->get('/')->headers->get('Content-Security-Policy');

        expect($csp)
            ->not->toContain('[::1]')
            ->and($csp)->toContain('http://127.0.0.1:5174')
            ->and($csp)->toContain('http://localhost:5173')
            ->and($csp)->toContain('ws://127.0.0.1:5174')
            ->and($csp)->toMatch('/script-src[^;]*http:\/\/127\.0\.0\.1:5174/')
            ->and($csp)->toMatch('/style-src[^;]*http:\/\/127\.0\.0\.1:5174/')
            ->and($csp)->toMatch('/connect-src[^;]*ws:\/\/127\.0\.0\.1:5174/')
            ->and($csp)->toContain("worker-src 'self' blob:")
            ->and($csp)->toMatch('/worker-src[^;]*http:\/\/127\.0\.0\.1:5174/');
    } finally {
        if ($previousHot === null) {
            @unlink($hotPath);
        } else {
            file_put_contents($hotPath, $previousHot);
        }
    }
});

test('local CSP rewrites ipv6 vite hot origins to 127.0.0.1', function () {
    app()->detectEnvironment(fn (): string => 'local');

    $hotPath = public_path('hot');
    $previousHot = is_file($hotPath) ? file_get_contents($hotPath) : null;
    file_put_contents($hotPath, "http://[::1]:5174\n");

    try {
        $csp = $this->get('/')->headers->get('Content-Security-Policy');

        expect($csp)
            ->not->toContain('[::1]')
            ->and($csp)->toContain('http://127.0.0.1:5174')
            ->and($csp)->toContain('ws://127.0.0.1:5174')
            ->and($csp)->toMatch('/script-src[^;]*http:\/\/127\.0\.0\.1:5174/')
            ->and($csp)->toMatch('/connect-src[^;]*ws:\/\/127\.0\.0\.1:5174/')
            ->and($csp)->toMatch('/worker-src[^;]*http:\/\/127\.0\.0\.1:5174/');
    } finally {
        if ($previousHot === null) {
            @unlink($hotPath);
        } else {
            file_put_contents($hotPath, $previousHot);
        }
    }
});

test('local CSP allows reverb websocket origins', function () {
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.options' => [
            'host' => 'localhost',
            'port' => 8080,
            'scheme' => 'http',
        ],
    ]);
    app()->detectEnvironment(fn (): string => 'local');

    $csp = $this->get('/')->headers->get('Content-Security-Policy');

    expect($csp)
        ->toContain('ws://localhost:8080')
        ->toContain('ws://127.0.0.1:8080')
        ->toContain('wss://localhost:8080')
        ->toMatch('/connect-src[^;]*ws:\/\/127\.0\.0\.1:8080/');
});

test('fan layout injects vite react refresh preamble before entry when hot', function () {
    $this->withVite();

    $hotPath = public_path('hot');
    $previousHot = is_file($hotPath) ? file_get_contents($hotPath) : null;
    file_put_contents($hotPath, "http://127.0.0.1:5174\n");

    try {
        $html = $this->get('/')->assertSuccessful()->getContent();

        expect($html)
            ->toContain('@react-refresh')
            ->toContain('__vite_plugin_react_preamble_installed__')
            ->toContain('resources/js/user.jsx');

        $preamblePos = strpos($html, '__vite_plugin_react_preamble_installed__');
        $entryPos = strpos($html, 'resources/js/user.jsx');

        expect($preamblePos)->not->toBeFalse()
            ->and($entryPos)->not->toBeFalse()
            ->and($preamblePos)->toBeLessThan($entryPos);
    } finally {
        if ($previousHot === null) {
            @unlink($hotPath);
        } else {
            file_put_contents($hotPath, $previousHot);
        }
    }
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
