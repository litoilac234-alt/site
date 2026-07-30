#!/bin/sh
set -eu

export PORT="${PORT:-8080}"

mkdir -p /var/www/html/storage/reports /tmp
chown -R www-data:www-data /var/www/html/storage 2>/dev/null || true

echo "=== Starting PHP app on 0.0.0.0:${PORT} ==="
# Auto-create tables in background (never blocks listening)
(php /var/www/html/api/setup_db.php || true) &

exec php -S "0.0.0.0:${PORT}" -t /var/www/html /var/www/html/router.php
