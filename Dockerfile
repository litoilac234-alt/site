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
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# --- Runtime: nginx + PHP-FPM ---
FROM php:8.2-fpm-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    libxml2-dev \
    unzip \
    gettext-base \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) pdo_mysql gd zip mbstring \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# Built SPA at document root + PHP API beside it
COPY --from=frontend /app/dist/. ./
COPY api ./api
COPY templates ./templates
COPY database ./database
COPY img ./img
COPY --from=vendor /app/vendor ./vendor
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/entrypoint.sh /entrypoint.sh

RUN mkdir -p storage/reports \
  && chmod +x /entrypoint.sh \
  && chown -R www-data:www-data /var/www/html/storage \
  && rm -f /etc/nginx/sites-enabled/default

ENV APP_BASE_PATH=/
ENV PORT=8080

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
