FROM composer:2 AS composer
FROM php:8.5-apache
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev unzip \
    && docker-php-ext-install pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/app
COPY composer.json composer.lock symfony.lock ./
ENV APP_ENV=prod APP_DEBUG=0 COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --prefer-dist --no-scripts --no-interaction --no-autoloader
COPY . .
RUN touch .env && composer dump-autoload --no-dev --classmap-authoritative --no-scripts \
    && mkdir -p var/cache var/log && chown -R www-data:www-data var
COPY deploy/api.conf /etc/apache2/sites-available/000-default.conf
EXPOSE 80
