#!/bin/sh
set -eu

export PORT="${PORT:-8080}"

mkdir -p /var/www/html/storage/reports /tmp
chown -R www-data:www-data /var/www/html/storage 2>/dev/null || true

rm -f /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*

sed "s/__PORT__/${PORT}/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "=== nginx config ==="
nginx -t 2>&1

echo "=== PHP-FPM config files ==="
ls -la /usr/local/etc/php-fpm.d/
cat /usr/local/etc/php-fpm.d/www.conf

echo "=== PHP-FPM config test ==="
php-fpm -t 2>&1

echo "=== Starting PHP-FPM ==="
php-fpm -D
sleep 2

echo "=== Verifying PHP-FPM process ==="
ps aux | grep php-fpm || echo "WARNING: ps not available"
ls -la /var/www/html/api/health.php || echo "WARNING: health.php not found"

echo "=== Starting nginx on 0.0.0.0:${PORT} ==="
exec nginx -g 'daemon off;'
