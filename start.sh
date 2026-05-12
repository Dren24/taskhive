#!/bin/bash
set -e

# Create .env from environment variables if it doesn't exist
if [ ! -f /var/www/.env ]; then
    echo "APP_NAME=${APP_NAME:-TaskHive}" > /var/www/.env
    echo "APP_ENV=${APP_ENV:-production}" >> /var/www/.env
    echo "APP_DEBUG=${APP_DEBUG:-false}" >> /var/www/.env
    echo "APP_KEY=${APP_KEY}" >> /var/www/.env
    echo "APP_URL=${APP_URL:-http://localhost}" >> /var/www/.env
    echo "DB_CONNECTION=${DB_CONNECTION:-pgsql}" >> /var/www/.env
    echo "DATABASE_URL=${DATABASE_URL}" >> /var/www/.env
    echo "SESSION_DRIVER=${SESSION_DRIVER:-cookie}" >> /var/www/.env
    echo "CACHE_STORE=${CACHE_STORE:-array}" >> /var/www/.env
    echo "LOG_CHANNEL=${LOG_CHANNEL:-stderr}" >> /var/www/.env
fi

cd /var/www

echo "==> Caching config/routes/views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Starting server on port ${PORT:-10000}..."
php artisan serve --host 0.0.0.0 --port ${PORT:-10000}
