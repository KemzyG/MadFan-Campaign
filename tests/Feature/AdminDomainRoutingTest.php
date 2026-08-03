<?php

use App\Http\Middleware\PreventFanRoutesOnAdminDomain;
use App\Support\AdminRouting;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Routing\Router;

test('admin routing helpers normalize empty domains', function () {
    config([
        'admin.domain' => null,
        'admin.app_domain' => null,
        'admin.filament_domain' => '',
    ]);

    expect(AdminRouting::appDomain())->toBeNull()
        ->and(AdminRouting::filamentDomain())->toBeNull();
});

test('admin routing helpers return configured hosts and paths', function () {
    config([
        'admin.app_domain' => 'admin.example.com',
        'admin.filament_domain' => 'panel.example.com',
        'admin.app_path' => 'app',
        'admin.filament_path' => 'admin',
    ]);

    expect(AdminRouting::appDomain())->toBe('admin.example.com')
        ->and(AdminRouting::filamentDomain())->toBe('panel.example.com')
        ->and(AdminRouting::appPath())->toBe('app')
        ->and(AdminRouting::appPathPrefix())->toBe('/app')
        ->and(AdminRouting::absoluteAppPath('login'))->toBe('/app/login')
        ->and(AdminRouting::filamentPath())->toBe('admin');
});

test('admin routing helpers support root-mounted console', function () {
    config([
        'admin.app_domain' => 'mod.example.com',
        'admin.app_path' => '',
    ]);

    expect(AdminRouting::appPath())->toBe('')
        ->and(AdminRouting::appPathPrefix())->toBe('')
        ->and(AdminRouting::absoluteAppPath())->toBe('/')
        ->and(AdminRouting::absoluteAppPath('login'))->toBe('/login')
        ->and(AdminRouting::absoluteAppPath('users'))->toBe('/users');
});

test('inertia admin login is reachable when no admin domain is configured', function () {
    expect(config('admin.app_domain'))->toBeNull();

    $this->get(route('admin.login'))->assertSuccessful();
});

test('dashboard route middleware order puts prevent-fan before authenticate', function () {
    $route = app('router')->getRoutes()->getByName('fan.dashboard');
    $gathered = app(Router::class)->gatherRouteMiddleware($route);

    $kernel = app(Kernel::class);
    $global = collect($kernel->getGlobalMiddleware())
        ->map(fn ($middleware) => is_string($middleware) ? $middleware : $middleware::class)
        ->all();

    expect($global)->toContain(PreventFanRoutesOnAdminDomain::class);

    $authenticate = null;
    foreach ($gathered as $index => $middleware) {
        if ($middleware === 'auth' || str_starts_with((string) $middleware, Authenticate::class)) {
            $authenticate = $index;
            break;
        }
    }

    expect($authenticate)->not->toBeNull();
});

test('prevent fan routes middleware redirects on admin host with root mount', function () {
    config([
        'admin.app_domain' => 'mod.madfan.test',
        'admin.filament_domain' => 'mod.madfan.test',
        'admin.app_path' => '',
        'app.url' => 'https://madfan.test',
    ]);

    $middleware = new PreventFanRoutesOnAdminDomain;

    $passport = $middleware->handle(
        Request::create('http://mod.madfan.test/passport', 'GET'),
        fn () => response('passed'),
    );

    expect($passport->isRedirect())->toBeTrue()
        ->and($passport->headers->get('Location'))->toBe('https://madfan.test/passport');

    $adminLogin = $middleware->handle(
        Request::create('http://mod.madfan.test/login', 'GET'),
        fn () => response('passed'),
    );

    expect($adminLogin->getContent())->toBe('passed');

    $root = $middleware->handle(
        Request::create('http://mod.madfan.test/', 'GET'),
        fn () => response('passed'),
    );

    expect($root->getContent())->toBe('passed');

    $legacyApp = $middleware->handle(
        Request::create('http://mod.madfan.test/app/users', 'GET'),
        fn () => response('passed'),
    );

    expect($legacyApp->isRedirect())->toBeTrue()
        ->and($legacyApp->headers->get('Location'))->toEndWith('/users');
});

test('prevent fan routes middleware still supports legacy /app mount', function () {
    config([
        'admin.app_domain' => 'mod.madfan.test',
        'admin.filament_domain' => 'mod.madfan.test',
        'admin.app_path' => 'app',
        'app.url' => 'https://madfan.test',
    ]);

    $middleware = new PreventFanRoutesOnAdminDomain;

    $dashboard = $middleware->handle(
        Request::create('http://mod.madfan.test/dashboard', 'GET'),
        fn () => response('passed'),
    );

    expect($dashboard->isRedirect())->toBeTrue()
        ->and($dashboard->headers->get('Location'))->toEndWith('/app');

    $adminLogin = $middleware->handle(
        Request::create('http://mod.madfan.test/app/login', 'GET'),
        fn () => response('passed'),
    );

    expect($adminLogin->getContent())->toBe('passed');
});

test('admin login page shares admin_path meta for the local /app mount', function () {
    $this->get('/app/login')
        ->assertSuccessful()
        ->assertSee('Admin Panel', false)
        ->assertSee('name="admin-path"', false)
        ->assertSee('content="/app"', false);
});
