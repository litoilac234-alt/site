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

if ! pgrep -x php-fpm > /dev/null 2>&1; then
    echo "ERROR: PHP-FPM failed to start!" >&2
    php-fpm -t 2>&1
    exit 1
fi
echo "PHP-FPM is running (pid $(pgrep -x php-fpm | head -1))."

echo "=== Starting nginx on 0.0.0.0:${PORT} ==="
exec nginx -g 'daemon off;'
