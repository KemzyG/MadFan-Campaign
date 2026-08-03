#!/usr/bin/env bash
# Run from the Laravel app root on cPanel Terminal/SSH:
#   cd ~/laravel && bash deploy/cpanel/post-deploy.sh
#
# Optional env overrides:
#   PUBLIC_HTML=~/public_html PHP_BIN=/usr/local/bin/php

set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$APP_ROOT"

echo "==> App root: $APP_ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.cpanel.example and configure DB/APP_URL first."
  exit 1
fi

PHP_BIN="${PHP_BIN:-php}"
COMPOSER_BIN="${COMPOSER_BIN:-composer}"
PUBLIC_HTML="${PUBLIC_HTML:-$HOME/public_html}"

echo "==> Ensure writable storage + upload directories"
mkdir -p \
  storage/app/public/avatars \
  storage/app/private/task-proofs \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs \
  bootstrap/cache

chmod -R ug+rwx storage bootstrap/cache 2>/dev/null || true

echo "==> Composer install (no-dev)"
$COMPOSER_BIN install --no-dev --prefer-dist --optimize-autoloader --no-interaction

echo "==> Migrate"
$PHP_BIN artisan migrate --force --no-interaction

echo "==> Storage link (fan avatars under public/storage/avatars)"
$PHP_BIN artisan storage:link --force || true

echo "==> Filament assets"
$PHP_BIN artisan filament:assets --no-interaction || true

echo "==> Livewire assets (static files for admin subdomain / cPanel)"
$PHP_BIN artisan livewire:publish --assets --no-interaction || true

echo "==> Optimize"
$PHP_BIN artisan config:clear
$PHP_BIN artisan route:clear
$PHP_BIN artisan view:clear
$PHP_BIN artisan optimize
$PHP_BIN artisan filament:optimize || true

sync_public_tree() {
  local src="$1"
  local dest="$2"

  if [[ ! -d "$src" ]]; then
    return 0
  fi

  mkdir -p "$dest"
  cp -R "$src/." "$dest/"
}

if [[ -d "$PUBLIC_HTML" ]]; then
  echo "==> Sync web assets → $PUBLIC_HTML"

  sync_public_tree "$APP_ROOT/public/build" "$PUBLIC_HTML/build"
  sync_public_tree "$APP_ROOT/public/css" "$PUBLIC_HTML/css"
  sync_public_tree "$APP_ROOT/public/js" "$PUBLIC_HTML/js"
  sync_public_tree "$APP_ROOT/public/fonts" "$PUBLIC_HTML/fonts"
  sync_public_tree "$APP_ROOT/public/models" "$PUBLIC_HTML/models"
  sync_public_tree "$APP_ROOT/public/vendor" "$PUBLIC_HTML/vendor"

  for asset in favicon.ico robots.txt default-avatar.png .user.ini; do
    if [[ -f "$APP_ROOT/public/$asset" ]]; then
      cp "$APP_ROOT/public/$asset" "$PUBLIC_HTML/$asset"
    fi
  done

  if [[ -f "$APP_ROOT/deploy/cpanel/public_html/index.php" ]]; then
    cp "$APP_ROOT/deploy/cpanel/public_html/index.php" "$PUBLIC_HTML/index.php"
    cp "$APP_ROOT/deploy/cpanel/public_html/.htaccess" "$PUBLIC_HTML/.htaccess"
  fi

  if [[ -L "$APP_ROOT/public/storage" || -d "$APP_ROOT/public/storage" ]]; then
    if [[ -L "$PUBLIC_HTML/storage" || -d "$PUBLIC_HTML/storage" ]]; then
      echo "    public_html/storage already exists (skipping)"
    else
      ln -sfn "$APP_ROOT/storage/app/public" "$PUBLIC_HTML/storage" 2>/dev/null \
        || echo "    Could not symlink public_html/storage — use .htaccess rewrite fallback"
    fi
  fi
else
  echo "==> PUBLIC_HTML not found ($PUBLIC_HTML) — skip asset sync"
fi

echo ""
echo "==> Done"
echo "Smoke tests:"
echo "  - \$APP_URL/up"
echo "  - \$APP_URL/passport (avatar upload after login)"
echo "  - \$APP_URL/admin and \$APP_URL/app (or admin subdomain)"
echo ""
echo "Uploads on cPanel:"
echo "  - Fan avatars: storage/app/public/avatars (served via public/storage symlink)"
echo "  - Task proof screenshots: storage/app/private (auth-only, NOT public/storage)"
