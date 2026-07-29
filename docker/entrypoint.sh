#!/bin/sh
set -eu

mkdir -p /var/www/html/storage/reports /tmp
chown -R www-data:www-data /var/www/html/storage || true

export PORT="${PORT:-8080}"
echo "=== PEO Monitoring starting on port ${PORT} ==="

# PHP-FPM must inherit Railway env vars (MySQL, APP_URL, etc.)
printf '\nclear_env = no\n' >> /usr/local/etc/php-fpm.d/zz-docker.conf

# Generate final nginx.conf from template, replacing $PORT
sed "s/\${PORT}/${PORT}/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Remove any leftover Debian default sites
rm -f /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*

echo "=== nginx config test ==="
nginx -t 2>&1

echo "=== Starting PHP-FPM ==="
php-fpm -D

echo "=== Starting nginx on 0.0.0.0:${PORT} ==="
exec nginx -g 'daemon off;'
