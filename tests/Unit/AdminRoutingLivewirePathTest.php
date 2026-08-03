<?php

use App\Http\Middleware\PreventFanRoutesOnAdminDomain;
use App\Support\AdminRouting;
use Illuminate\Http\Request;
use Tests\TestCase;

uses(TestCase::class);

test('admin routing detects livewire asset and update paths', function () {
    expect(AdminRouting::isLivewirePath(Request::create('/livewire-8a72d594/livewire.js', 'GET')))->toBeTrue()
        ->and(AdminRouting::isLivewirePath(Request::create('/livewire-8a72d594/update', 'POST')))->toBeTrue()
        ->and(AdminRouting::isLivewirePath(Request::create('/vendor/livewire/livewire.min.js', 'GET')))->toBeTrue()
        ->and(AdminRouting::isLivewirePath(Request::create('/passport', 'GET')))->toBeFalse();
});

test('prevent fan routes middleware allows livewire when admin uses legacy /app mount', function () {
    config([
        'admin.app_domain' => 'md.madfan.test',
        'admin.filament_domain' => 'md.madfan.test',
        'admin.app_path' => 'app',
        'app.url' => 'https://madfan.test',
    ]);

    $middleware = new PreventFanRoutesOnAdminDomain;

    $script = $middleware->handle(
        Request::create('http://md.madfan.test/livewire-8a72d594/livewire.js', 'GET'),
        fn () => response('livewire-ok'),
    );

    expect($script->getContent())->toBe('livewire-ok');
});
