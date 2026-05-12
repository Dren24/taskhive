#!/bin/bash
set -e

# Create .env from environment variables if it doesn't exist
if [ ! -f /var/www/.env ]; then
    echo "APP_NAME=${APP_NAME:-TaskHive}" > /var/www/.env
    echo "APP_ENV=${APP_ENV:-production}" >> /var/www/.env
    echo "APP_DEBUG=${APP_DEBUG:-false}" >> /var/www/.env
    # Ensure APP_KEY has the required base64: prefix Laravel needs
    if [[ "${APP_KEY}" != base64:* ]]; then
        echo "APP_KEY=base64:${APP_KEY}" >> /var/www/.env
    else
        echo "APP_KEY=${APP_KEY}" >> /var/www/.env
    fi
    echo "APP_URL=${APP_URL:-http://localhost}" >> /var/www/.env
    echo "DB_CONNECTION=${DB_CONNECTION:-pgsql}" >> /var/www/.env
    echo "SESSION_DRIVER=${SESSION_DRIVER:-cookie}" >> /var/www/.env
    echo "CACHE_STORE=${CACHE_STORE:-array}" >> /var/www/.env
    echo "LOG_CHANNEL=${LOG_CHANNEL:-stderr}" >> /var/www/.env

    # Parse DATABASE_URL into individual DB_* vars that Laravel understands
    if [ -n "$DATABASE_URL" ]; then
        echo "==> Parsing DATABASE_URL..."
        php -r "
            \$url = getenv('DATABASE_URL');
            \$parts = parse_url(\$url);
            echo 'DB_HOST=' . \$parts['host'] . PHP_EOL;
            echo 'DB_PORT=' . (\$parts['port'] ?? 5432) . PHP_EOL;
            echo 'DB_DATABASE=' . ltrim(\$parts['path'], '/') . PHP_EOL;
            echo 'DB_USERNAME=' . (\$parts['user'] ?? '') . PHP_EOL;
            echo 'DB_PASSWORD=' . (\$parts['pass'] ?? '') . PHP_EOL;
            echo 'DB_SSLMODE=require' . PHP_EOL;
        " >> /var/www/.env
    fi
fi

echo "==> .env contents (DB vars):"
grep "^DB_" /var/www/.env || echo "(none)"

cd /var/www

echo "==> Caching config/routes/views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Starting server on port ${PORT:-10000}..."
exec php artisan serve --host 0.0.0.0 --port ${PORT:-10000}
