# Mad Fan — production image for Render (Docker web service)
# Multi-stage: Vite assets + Composer vendor + Nginx/PHP-FPM + Reverb on $PORT

FROM node:22-bookworm-slim AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY vite.config.js ./
COPY resources ./resources
COPY public ./public

# Vite bakes these at build time. On Render, declare matching service env vars
# (they are passed as Docker build-args). Prefer empty VITE_REVERB_HOST so Echo
# uses window.location.hostname (same-origin nginx /app proxy on 443).
ARG VITE_REVERB_APP_KEY=
ARG VITE_REVERB_HOST=
ARG VITE_REVERB_PORT=443
ARG VITE_REVERB_SCHEME=https
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_REVERB_HOST=$VITE_REVERB_HOST \
    VITE_REVERB_PORT=$VITE_REVERB_PORT \
    VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

RUN npm run build

FROM composer:2 AS vendor
WORKDIR /app
# Composer image lacks intl/gmp; the runtime stage installs them.
ENV COMPOSER_ALLOW_SUPERUSER=1
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction \
    --ignore-platform-req=ext-intl \
    --ignore-platform-req=ext-gmp
COPY . .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev --no-interaction

FROM php:8.4-fpm-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        supervisor \
        curl \
        git \
        unzip \
        libpq-dev \
        libgmp-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libzip-dev \
        libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_pgsql \
        pgsql \
        gmp \
        gd \
        zip \
        bcmath \
        intl \
        opcache \
        pcntl \
        sockets \
    && rm -rf /var/lib/apt/lists/*

COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/nginx/default.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/start.sh /usr/local/bin/start-madfan.sh
COPY docker/start-reverb.sh /usr/local/bin/start-reverb.sh

RUN rm -f /etc/nginx/sites-enabled/default \
    && ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default \
    && chmod +x /usr/local/bin/start-madfan.sh /usr/local/bin/start-reverb.sh

WORKDIR /var/www/html

COPY --from=vendor /app /var/www/html
COPY --from=assets /app/public/build /var/www/html/public/build

# public/landing-media is gitignored; seed from committed sources so /landing-media/*
# (including CSS --mf-stadium-image for shop) works before runtime sync / Cloudinary upload.
RUN mkdir -p public/landing-media \
    && cp resources/images/landing/*.png public/landing-media/

# public/stage-media is gitignored; seed stage room backgrounds for modal/lobby backdrops.
RUN mkdir -p public/stage-media \
    && cp resources/images/stage/*.png public/stage-media/

RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwx storage bootstrap/cache

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    PHP_FPM_LISTEN=/run/php/php-fpm.sock

EXPOSE 10000

CMD ["/usr/local/bin/start-madfan.sh"]
