#!/bin/sh
set -eu

# Railway injects PORT. Do not hardcode blindly.
echo "=== Railway port debug ==="
echo "PORT=${PORT:-<unset>}"
env | grep -iE '^(PORT|RAILWAY_)=' | sort || true

export PORT="${PORT:-8080}"
echo "=== Binding PHP server to 0.0.0.0:${PORT} ==="

# Start server in background, prove it answers locally, then keep it in foreground
php -S "0.0.0.0:${PORT}" -t /var/www/html /var/www/html/router.php &
PID=$!
sleep 1

echo "=== Local self-check ==="
if php -r "echo file_get_contents('http://127.0.0.1:${PORT}/') !== false ? 'LOCAL_OK\n' : 'LOCAL_FAIL\n';"; then
  true
else
  echo "LOCAL_FAIL"
fi

# Keep container alive with the PHP server as PID 1
wait "$PID"
