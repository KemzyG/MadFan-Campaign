#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

if [[ "${BROADCAST_CONNECTION:-null}" != "reverb" ]]; then
  echo "Skipping Reverb (BROADCAST_CONNECTION=${BROADCAST_CONNECTION:-unset})"
  exec tail -f /dev/null
fi

host="${REVERB_SERVER_HOST:-0.0.0.0}"
port="${REVERB_SERVER_PORT:-8080}"

echo "Starting Laravel Reverb on ${host}:${port}"
exec php artisan reverb:start --host="${host}" --port="${port}"
