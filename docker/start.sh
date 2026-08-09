#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-10000}"
ROOT="/var/www/html"

cd "$ROOT"

sed -i "s/__PORT__/${PORT}/g" /etc/nginx/sites-available/default

mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true

php artisan storage:link --force >/dev/null 2>&1 || true

if [[ -n "${APP_KEY:-}" ]]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache || true
fi

if [[ -n "${DATABASE_URL:-}" || -n "${DB_HOST:-}" ]]; then
  echo "Running migrations..."
  php artisan migrate --force --no-interaction
fi

echo "Starting Mad Fan on port ${PORT}"
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
