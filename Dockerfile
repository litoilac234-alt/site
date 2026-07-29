# syntax=docker/dockerfile:1

# --- Frontend build ---
FROM node:22-bookworm AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json eslint.config.js ./
COPY src ./src
COPY public ./public
COPY img ./img
ENV VITE_BASE=/
RUN npm run build

# --- PHP dependencies ---
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts \
    --ignore-platform-req=ext-gd \
    --ignore-platform-req=ext-zip \
    --ignore-platform-req=ext-mbstring

# --- Runtime: nginx + PHP-FPM ---
FROM php:8.2-fpm-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    libxml2-dev \
    libonig-dev \
    unzip \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) pdo_mysql gd zip mbstring \
  && rm -rf /var/lib/apt/lists/* \
  && rm -f /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*

# Keep global docker FPM settings; replace only the pool listen/env config
RUN rm -f /usr/local/etc/php-fpm.d/www.conf /usr/local/etc/php-fpm.d/zz-docker.conf \
  && printf '[global]\n\
error_log = /proc/self/fd/2\n\
\n\
[www]\n\
user = www-data\n\
group = www-data\n\
listen = 127.0.0.1:9000\n\
pm = dynamic\n\
pm.max_children = 10\n\
pm.start_servers = 2\n\
pm.min_spare_servers = 1\n\
pm.max_spare_servers = 4\n\
clear_env = no\n\
catch_workers_output = yes\n\
decorate_workers_output = no\n\
access.log = /proc/self/fd/2\n\
' > /usr/local/etc/php-fpm.d/www.conf \
  && php-fpm -t

WORKDIR /var/www/html

COPY --from=frontend /app/dist/. ./
COPY api ./api
COPY templates ./templates
COPY database ./database
COPY img ./img
COPY --from=vendor /app/vendor ./vendor

RUN mkdir -p storage/reports \
  && chown -R www-data:www-data /var/www/html/storage

# Bake the nginx config inline (no external file, no CRLF issues)
RUN printf 'worker_processes auto;\n\
error_log /dev/stderr warn;\n\
pid /tmp/nginx.pid;\n\
events { worker_connections 1024; }\n\
http {\n\
    include /etc/nginx/mime.types;\n\
    default_type application/octet-stream;\n\
    access_log /dev/stdout;\n\
    sendfile on;\n\
    keepalive_timeout 65;\n\
    client_max_body_size 32M;\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;\n\
    gzip_min_length 256;\n\
    server {\n\
        listen 0.0.0.0:__PORT__;\n\
        listen [::]:__PORT__;\n\
        server_name _;\n\
        root /var/www/html;\n\
        index index.html;\n\
        location ~ ^/api/(.+\\.php)(/.*)?$ {\n\
            include fastcgi_params;\n\
            fastcgi_param SCRIPT_FILENAME $document_root/api/$1;\n\
            fastcgi_pass 127.0.0.1:9000;\n\
            fastcgi_read_timeout 120s;\n\
        }\n\
        location /storage/ { alias /var/www/html/storage/; try_files $uri =404; }\n\
        location /templates/ { alias /var/www/html/templates/; try_files $uri =404; }\n\
        location /img/ { alias /var/www/html/img/; try_files $uri =404; }\n\
        location / { try_files $uri $uri/ /index.html; }\n\
    }\n\
}\n' > /etc/nginx/nginx.conf.template

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV APP_BASE_PATH=/
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
