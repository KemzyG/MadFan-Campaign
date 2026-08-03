<?php

use Illuminate\Support\Facades\URL;

test('force https is disabled by default in testing', function () {
    expect((bool) config('app.force_https'))->toBeFalse();
});

test('production force https generates https urls when enabled', function () {
    config(['app.force_https' => true, 'app.url' => 'https://example.test']);

    URL::forceScheme('https');

    expect(url('/login'))->toStartWith('https://');
});

test('root htaccess shim exists for public_html deployments', function () {
    expect(file_exists(base_path('.htaccess')))->toBeTrue();

    $contents = file_get_contents(base_path('.htaccess'));

    expect($contents)->toContain('RewriteRule ^(.*)$ public/$1 [L]');
    expect($contents)->toContain('vendor');
});

test('cpanel public_html shim bootstraps laravel from sibling app path', function () {
    $index = base_path('deploy/cpanel/public_html/index.php');

    expect(file_exists($index))->toBeTrue();

    $contents = file_get_contents($index);

    expect($contents)->toContain("'app', 'laravel', 'backend'")
        ->and($contents)->toContain('bootstrap/app.php')
        ->and($contents)->toContain('usePublicPath(__DIR__)');
});

test('cpanel env example uses shared-hosting friendly drivers', function () {
    $env = file_get_contents(base_path('.env.cpanel.example'));

    expect($env)->toContain('APP_ENV=production');
    expect($env)->toContain('FORCE_HTTPS=true');
    expect($env)->toContain('QUEUE_CONNECTION=sync');
    expect($env)->toContain('CACHE_STORE=database');
    expect($env)->toContain('SESSION_SECURE_COOKIE=true');
});

test('public user.ini raises memory for filament on shared hosting', function () {
    $ini = file_get_contents(public_path('.user.ini'));

    expect($ini)->toContain('memory_limit = 256M');
});

test('cpanel mysql dump includes schema and seed data', function () {
    $dump = base_path('database/cpanel/madfan_schema.sql');

    expect(file_exists($dump))->toBeTrue();

    $contents = file_get_contents($dump);

    expect($contents)->toContain('SET FOREIGN_KEY_CHECKS = 0');
    expect($contents)->toContain('CREATE TABLE `users`');
    expect($contents)->toContain('VARCHAR(255)');
    expect($contents)->toContain('INSERT INTO `roles`');
    expect($contents)->toContain('INSERT INTO `loyalty_tiers`');
    expect($contents)->not->toContain('` VARCHAR ');
});

test('cpanel create admin sql is available for hosts without terminal', function () {
    $sql = base_path('database/cpanel/create_admin.sql');

    expect(file_exists($sql))->toBeTrue();
    expect(file_get_contents($sql))->toContain('ChangeMe123!');
});

test('filament public assets are published for shared hosting', function () {
    expect(file_exists(public_path('js/filament/filament/app.js')))->toBeTrue();
    expect(file_exists(public_path('css/filament/filament/app.css')))->toBeTrue();
    expect(file_exists(public_path('js/filament/schemas/schemas.js')))->toBeTrue();
    expect(file_exists(public_path('fonts/filament/filament/inter/inter-latin-wght-normal-NRMW37G5.woff2')))->toBeTrue();
});

test('cpanel migrate helper seeds filament admin', function () {
    $migrate = file_get_contents(public_path('cpanel-migrate.php'));

    expect($migrate)->toContain('FilamentAdminSeeder')
        ->and($migrate)->toContain('db:seed')
        ->and($migrate)->toContain('FILAMENT_ADMIN_EMAIL')
        ->and($migrate)->toContain('PublicHtmlStorageLink')
        ->and($migrate)->toContain('usePublicPath');

    $deployCopy = file_get_contents(base_path('deploy/cpanel/public_html/cpanel-migrate.php'));

    expect($deployCopy)->toContain('FilamentAdminSeeder')
        ->and($deployCopy)->toContain('PublicHtmlStorageLink');
});

test('cpanel sync storage helper exists for hosts without terminal', function () {
    expect(file_exists(public_path('cpanel-sync-storage.php')))->toBeTrue();
    expect(file_exists(base_path('deploy/cpanel/public_html/cpanel-sync-storage.php')))->toBeTrue();

    $contents = file_get_contents(public_path('cpanel-sync-storage.php'));

    expect($contents)->toContain('DEPLOY_MIGRATE_SECRET')
        ->and($contents)->toContain('Mode: symlink')
        ->and($contents)->toContain('Mode: serve')
        ->and($contents)->not->toContain('PublicHtmlStorageLink');
});

test('cpanel public_html htaccess uses front controller without out-of-root storage rewrite', function () {
    $htaccess = file_get_contents(base_path('deploy/cpanel/public_html/.htaccess'));

    expect($htaccess)->toContain('RewriteRule ^ index.php [L]')
        ->and($htaccess)->not->toContain('../app/storage/app/public')
        ->and($htaccess)->not->toContain('RewriteRule ^(.*)$ public/$1 [L]');
});

test('export mysql dump command is registered', function () {
    $this->artisan('app:export-mysql-dump --help')
        ->assertSuccessful();
});

test('package public assets command is registered', function () {
    $this->artisan('app:package-public-assets --help')
        ->assertSuccessful();
});
