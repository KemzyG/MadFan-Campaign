#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-10000}"
REVERB_SERVER_PORT="${REVERB_SERVER_PORT:-8080}"
ROOT="/var/www/html"

cd "$ROOT"

# Render links inject DATABASE_URL; Laravel reads DB_URL.
if [[ -n "${DATABASE_URL:-}" && -z "${DB_URL:-}" ]]; then
  export DB_URL="${DATABASE_URL}"
fi

# Public HTTP port + internal Reverb listen port for nginx → reverb proxy.
sed -i "s/__PORT__/${PORT}/g; s/__REVERB_PORT__/${REVERB_SERVER_PORT}/g" /etc/nginx/sites-available/default

mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true

php artisan storage:link --force >/dev/null 2>&1 || true

if [[ -n "${APP_KEY:-}" ]]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache || true
fi

if [[ -n "${DB_URL:-}${DATABASE_URL:-}${DB_HOST:-}" ]]; then
  echo "Running migrations..."
  php artisan migrate --force --no-interaction
fi

if [[ "${RUN_SEEDERS:-}" == "true" ]]; then
  echo "Running ProductionCoreSeeder..."
  php artisan db:seed --class=Database\\Seeders\\ProductionCoreSeeder --force --no-interaction
fi

echo "Starting Mad Fan on port ${PORT}"
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
