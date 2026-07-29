#!/bin/sh
set -eu

export PORT="${PORT:-8080}"

mkdir -p /var/www/html/storage/reports /tmp
chown -R www-data:www-data /var/www/html/storage 2>/dev/null || true

# Remove any leftover Debian default sites
rm -f /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*

# Generate final nginx.conf from template
sed "s/__PORT__/${PORT}/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "=== nginx config test ==="
nginx -t 2>&1

echo "=== Starting PHP-FPM ==="
php-fpm -D
sleep 1

if ! kill -0 "$(cat /usr/local/var/run/php-fpm.pid 2>/dev/null || echo 0)" 2>/dev/null; then
    if ! kill -0 "$(cat /run/php-fpm.pid 2>/dev/null || echo 0)" 2>/dev/null; then
        echo "ERROR: PHP-FPM failed to start!" >&2
        php-fpm -t 2>&1
        exit 1
    fi
fi
echo "PHP-FPM is running."

echo "=== Starting nginx on 0.0.0.0:${PORT} ==="
exec nginx -g 'daemon off;'
