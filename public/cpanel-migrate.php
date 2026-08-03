<?php

/**
 * One-shot cPanel deploy helper (no SSH/Terminal required).
 *
 * Setup:
 * 1. In .env set: DEPLOY_MIGRATE_SECRET=a-long-random-string
 *    Also set FILAMENT_ADMIN_EMAIL / FILAMENT_ADMIN_PASSWORD for the admin seed.
 * 2. Visit (once):
 *    https://your-domain.com/cpanel-migrate.php?secret=a-long-random-string
 * 3. DELETE this file immediately after a successful run.
 *
 * Optional: &mirror=1 forces a file copy into public_html/storage (not recommended —
 * copies go stale until you re-run). Prefer symlink or Laravel public.serve.
 *
 * Runs: migrate → FilamentAdminSeeder → storage:link → public_html storage wire → optimize
 */

use App\Support\PublicHtmlStorageLink;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;

define('LARAVEL_START', microtime(true));

$secret = $_GET['secret'] ?? '';
$allowMirror = isset($_GET['mirror']) && (string) $_GET['mirror'] === '1';

$applicationPath = dirname(__DIR__);
$webRoot = __DIR__;

if (! is_file($applicationPath.'/artisan')) {
    foreach (['app', 'laravel', 'backend', 'backend/backend'] as $candidate) {
        $try = dirname(__DIR__).'/'.$candidate;
        if (is_file($try.'/artisan')) {
            $applicationPath = $try;
            break;
        }
    }
}

if (! is_file($applicationPath.'/artisan')) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Laravel app not found. Place this file in public_html and the app in ../app (or edit \$applicationPath).\n";
    exit(1);
}

$envFile = $applicationPath.'/.env';
if (! is_file($envFile)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Missing .env in {$applicationPath}\n";
    exit(1);
}

$expected = null;
foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#')) {
        continue;
    }
    if (str_starts_with($line, 'DEPLOY_MIGRATE_SECRET=')) {
        $expected = trim(substr($line, strlen('DEPLOY_MIGRATE_SECRET=')), " \t\"'");
        break;
    }
}

if (! is_string($expected) || $expected === '' || ! hash_equals($expected, (string) $secret)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Forbidden. Set DEPLOY_MIGRATE_SECRET in .env and pass ?secret=...\n";
    exit(1);
}

require $applicationPath.'/vendor/autoload.php';

/** @var Application $app */
$app = require $applicationPath.'/bootstrap/app.php';

// So storage:link targets public_html/storage, not app/public/storage.
$app->usePublicPath($webRoot);

$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain; charset=UTF-8');

$steps = [
    ['migrate', ['--force' => true]],
    ['db:seed', ['--class' => 'Database\\Seeders\\FilamentAdminSeeder', '--force' => true]],
    ['storage:link', ['--force' => true]],
    ['optimize', []],
];

$exitCode = 0;

foreach ($steps as [$command, $arguments]) {
    echo "Running artisan {$command} …\n\n";
    $code = $kernel->call($command, $arguments);
    echo $kernel->output();
    echo "\nExit code: {$code}\n\n";

    // storage:link often fails on shared hosts — continue and use PublicHtmlStorageLink.
    if ($code !== 0 && $command !== 'storage:link') {
        $exitCode = $code;
        break;
    }
}

if ($exitCode === 0) {
    $result = PublicHtmlStorageLink::ensure($webRoot, $applicationPath, $allowMirror);
    echo $result['message']."\n";
    echo 'Mode: '.$result['mode']."\n\n";

    if (! $result['ok']) {
        $exitCode = 1;
    }

    $adminEmail = (string) env('FILAMENT_ADMIN_EMAIL', 'admin@madfan.test');
    echo "OK — DELETE cpanel-migrate.php from the web root now.\n";
    echo "Also remove DEPLOY_MIGRATE_SECRET from .env.\n";
    echo "Filament admin seeded for: {$adminEmail} (password from FILAMENT_ADMIN_PASSWORD) → /admin\n";
    echo "Club logos URL: https://your-domain.com/storage/clubs/….jpg\n";
    if ($result['mode'] === 'mirror') {
        echo "WARNING: copy mode — re-run sync after each logo upload, or rename storage → storage-old and create a symlink.\n";
    }
    if ($result['mode'] === 'serve') {
        echo "No public_html/storage folder needed; Laravel serves /storage/* from app/storage/app/public.\n";
    }
}

exit($exitCode);
