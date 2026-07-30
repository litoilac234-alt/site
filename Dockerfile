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

# --- Runtime: single PHP process (reliable on Railway) ---
FROM php:8.2-cli-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    libxml2-dev \
    libonig-dev \
    unzip \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) pdo_mysql gd zip mbstring \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY --from=frontend /app/dist/. ./
COPY api ./api
COPY templates ./templates
COPY database ./database
COPY img ./img
COPY router.php ./router.php
COPY --from=vendor /app/vendor ./vendor

RUN mkdir -p storage/reports \
  && chown -R www-data:www-data /var/www/html/storage

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && sed -i 's/\r$//' /entrypoint.sh

ENV APP_BASE_PATH=/
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
