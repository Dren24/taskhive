#!/bin/bash
set -e

# Always write a fresh .env from environment variables
echo "==> Writing .env..."

# Ensure APP_KEY has the required base64: prefix Laravel needs
APP_KEY_VALUE="${APP_KEY}"
if [[ "${APP_KEY_VALUE}" != base64:* ]]; then
    APP_KEY_VALUE="base64:${APP_KEY_VALUE}"
fi

echo "==> APP_KEY prefix check: ${APP_KEY_VALUE:0:10}..."

# Write .env using printf to avoid shell interpretation of special characters
{
    printf 'APP_NAME=%s\n'       "${APP_NAME:-TaskHive}"
    printf 'APP_ENV=%s\n'        "${APP_ENV:-production}"
    printf 'APP_DEBUG=%s\n'      "${APP_DEBUG:-false}"
    printf 'APP_KEY=%s\n'        "${APP_KEY_VALUE}"
    printf 'APP_URL=%s\n'        "${APP_URL:-http://localhost}"
    printf 'DB_CONNECTION=%s\n'  "${DB_CONNECTION:-pgsql}"
    printf 'SESSION_DRIVER=%s\n' "${SESSION_DRIVER:-cookie}"
    printf 'CACHE_STORE=%s\n'    "${CACHE_STORE:-array}"
    printf 'LOG_CHANNEL=%s\n'    "${LOG_CHANNEL:-stderr}"
} > /var/www/.env

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

echo "==> .env DB vars:"
grep "^DB_" /var/www/.env || echo "(none)"

cd /var/www

echo "==> Clearing and rebuilding config cache..."
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Closing any overdue tasks..."
php artisan tasks:close-overdue

echo "==> Starting scheduler in background..."
(while true; do php artisan schedule:run --no-interaction >> /dev/null 2>&1; sleep 60; done) &

echo "==> Starting server on port ${PORT:-10000}..."
exec php artisan serve --host 0.0.0.0 --port ${PORT:-10000}
