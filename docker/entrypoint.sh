#!/bin/sh
set -eu

export PORT="${PORT:-8080}"

mkdir -p /var/www/html/storage/reports /tmp
chown -R www-data:www-data /var/www/html/storage 2>/dev/null || true

rm -f /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*

sed "s/__PORT__/${PORT}/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "=== nginx config test (PORT=${PORT}) ==="
nginx -t

echo "=== Starting PHP-FPM ==="
php-fpm -D
sleep 1

echo "=== Starting nginx on 0.0.0.0:${PORT} ==="
exec nginx -g 'daemon off;'
