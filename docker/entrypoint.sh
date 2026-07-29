#!/bin/sh
set -eu

mkdir -p /var/www/html/storage/reports /tmp
chown -R www-data:www-data /var/www/html/storage || true

export PORT="${PORT:-8080}"
echo "Starting on PORT=${PORT}"

# PHP-FPM must inherit Railway env vars (MySQL, APP_URL, etc.)
printf '\nclear_env = no\n' >> /usr/local/etc/php-fpm.d/zz-docker.conf

# Replace nginx config entirely (avoid Debian default :80 site)
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/nginx.conf

# Drop packaged site configs so nothing else binds ports
rm -f /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*

nginx -t
php-fpm -D
exec nginx -g 'daemon off;'
