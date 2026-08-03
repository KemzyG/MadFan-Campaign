<?php

/**
 * One-shot: wire public_html/storage (prefer symlink; no auto-copy).
 *
 * Self-contained — does not require uploading new app/Support classes.
 *
 * 1. Set DEPLOY_MIGRATE_SECRET in .env
 * 2. In File Manager: rename public_html/storage → storage-old (if it exists)
 * 3. Upload this file to public_html/
 * 4. Visit https://your-domain.com/cpanel-sync-storage.php?secret=...
 *    Optional: &mirror=1 to force a file copy (stale until re-run — avoid if possible)
 * 5. DELETE this file
 */
define('LARAVEL_START', microtime(true));

$secret = $_GET['secret'] ?? '';
$allowMirror = isset($_GET['mirror']) && (string) $_GET['mirror'] === '1';
$webRoot = __DIR__;
$applicationPath = dirname(__DIR__);

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
    echo "Laravel app not found next to public_html.\n";
    exit(1);
}

$envFile = $applicationPath.'/.env';
$expected = null;
if (is_file($envFile)) {
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
}

if (! is_string($expected) || $expected === '' || ! hash_equals($expected, (string) $secret)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Forbidden. Set DEPLOY_MIGRATE_SECRET in .env and pass ?secret=...\n";
    exit(1);
}

header('Content-Type: text/plain; charset=UTF-8');

$link = $webRoot.'/storage';
$target = $applicationPath.'/storage/app/public';

if (! is_dir($target)) {
    mkdir($target, 0755, true);
}

/**
 * Recursively copy public disk files into a real public_html/storage folder.
 */
$mirror = static function (string $source, string $destination): int {
    if (! is_dir($source)) {
        return 0;
    }

    if (! is_dir($destination)) {
        mkdir($destination, 0755, true);
    }

    $copied = 0;
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST,
    );

    foreach ($iterator as $item) {
        $relative = substr($item->getPathname(), strlen($source) + 1);
        $destPath = $destination.'/'.$relative;

        if ($item->isDir()) {
            if (! is_dir($destPath)) {
                mkdir($destPath, 0755, true);
            }

            continue;
        }

        $dir = dirname($destPath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        if (copy($item->getPathname(), $destPath)) {
            $copied++;
        }
    }

    return $copied;
};

if (is_link($link)) {
    $current = readlink($link) ?: '';
    echo "OK — public_html/storage is already a symlink → {$current}\n";
    echo "Mode: symlink\n";
    echo "New uploads show immediately.\n";
    echo "DELETE cpanel-sync-storage.php from public_html now.\n";
    exit(0);
}

if (file_exists($link) || is_dir($link)) {
    echo "BLOCKED — public_html/storage is a real folder (copy), not a symlink.\n";
    echo "Mode: directory\n";
    echo "1. File Manager: rename storage → storage-old\n";
    echo "2. Re-run this script (without &mirror=1)\n";
    if ($allowMirror) {
        $copied = $mirror($target, $link);
        echo "\nForced mirror: copied {$copied} file(s) into existing folder.\n";
        echo "WARNING: copy mode — re-run after every logo upload.\n";
        echo "DELETE cpanel-sync-storage.php from public_html now.\n";
        exit(0);
    }
    echo "Or rely on Laravel serving /storage/* (upload updated config + index.php with usePublicPath).\n";
    echo "DELETE cpanel-sync-storage.php when done.\n";
    exit(1);
}

if (@symlink($target, $link)) {
    echo "OK — created symlink public_html/storage → {$target}\n";
    echo "Mode: symlink\n";
    echo "New uploads show immediately.\n";
    echo "Test: https://madfan.xyz/storage/clubs/YOUR-FILE.jpg\n";
    echo "DELETE cpanel-sync-storage.php from public_html now.\n";
    exit(0);
}

if ($allowMirror) {
    $copied = $mirror($target, $link);
    echo "Symlink failed; mirrored {$copied} file(s) to public_html/storage\n";
    echo "Mode: mirror\n";
    echo "WARNING: copy mode — re-run after every logo upload.\n";
    echo "DELETE cpanel-sync-storage.php from public_html now.\n";
    exit(0);
}

echo "OK — could not create symlink (common on shared hosting).\n";
echo "Mode: serve\n";
echo "No public_html/storage folder created.\n";
echo "Laravel should serve /storage/* from {$target} when:\n";
echo "  - index.php has: \$app->usePublicPath(__DIR__);\n";
echo "  - config/filesystems.php has public disk serve => true\n";
echo "  - config cache cleared (delete bootstrap/cache/config.php if present)\n";
echo "Test: https://madfan.xyz/storage/clubs/YOUR-FILE.jpg\n";
echo "Only use &mirror=1 if that URL still 404s.\n";
echo "DELETE cpanel-sync-storage.php from public_html now.\n";
exit(0);
