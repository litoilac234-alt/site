#!/bin/sh
set -eu

export PORT="${PORT:-8080}"
echo "=== Cloud deploy startup ==="
echo "PORT=${PORT}"
echo "APP_URL=${APP_URL:-<unset>}"
echo "RENDER_EXTERNAL_URL=${RENDER_EXTERNAL_URL:-<unset>}"

# Auto-install DB tables on first boot (safe to re-run)
if [ -f /var/www/html/api/setup_db.php ]; then
  echo "=== Database setup check ==="
  php /var/www/html/api/setup_db.php || true
fi

echo "=== Binding PHP server to 0.0.0.0:${PORT} ==="

php -S "0.0.0.0:${PORT}" -t /var/www/html /var/www/html/router.php &
PID=$!
sleep 1

echo "=== Local self-check ==="
php -r "echo file_get_contents('http://127.0.0.1:${PORT}/api/health.php') ?: 'LOCAL_FAIL'; echo PHP_EOL;" || echo "LOCAL_FAIL"

wait "$PID"
