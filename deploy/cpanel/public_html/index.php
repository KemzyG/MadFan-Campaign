<?php

/**
 * cPanel public_html front controller.
 *
 * Recommended layout:
 *   ~/app/ or ~/laravel/  ← application root (this repo)
 *   ~/public_html/        ← this file + .htaccess + public/build (+ css/js/fonts)
 *
 * usePublicPath(__DIR__) makes storage:link create public_html/storage →
 * app/storage/app/public so new uploads (club logos, avatars) show immediately.
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$applicationPath = null;

foreach (['app', 'laravel', 'backend', 'backend/backend'] as $candidate) {
    $path = __DIR__.'/../'.$candidate;
    if (is_dir($path) && is_file($path.'/artisan')) {
        $applicationPath = $path;
        break;
    }
}

if ($applicationPath === null) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Laravel application not found. Update \$applicationPath in public_html/index.php.\n";
    echo "Tried: ../app, ../laravel, ../backend, ../backend/backend relative to public_html.\n";
    exit(1);
}

if (file_exists($maintenance = $applicationPath.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $applicationPath.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $applicationPath.'/bootstrap/app.php';

// Document root is public_html, not app/public — required for storage:link + public assets.
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
