#!/bin/sh
set -e

mkdir -p /var/www/html/storage/reports
chown -R www-data:www-data /var/www/html/storage || true

# Railway injects PORT; default for local docker run
export PORT="${PORT:-8080}"

# Let PHP-FPM see Railway/MySQL environment variables
printf '\nclear_env = no\n' >> /usr/local/etc/php-fpm.d/zz-docker.conf

envsubst '${PORT}' < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/sites-available/default
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

php-fpm -D
exec nginx -g 'daemon off;'
