#!/bin/sh
export PORT="${PORT:-8080}"
mkdir -p /var/www/html/storage/reports
echo "Listening on 0.0.0.0:${PORT}"
exec php -d display_errors=0 -S "0.0.0.0:${PORT}" -t /var/www/html /var/www/html/router.php
