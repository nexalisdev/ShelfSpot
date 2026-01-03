#!/bin/sh

# Ensure /app directory is writable
chmod -R 777 /app

# Check if .env file exists
if [ ! -f "/app/.env" ]; then
  echo "Creating default .env file..."
  cat <<EOF > /app/.env
# Default environment variables for local development

# Database Configuration
DATABASE_URL="postgresql://postgres:password@db:5432/shelfspot"

# JWT Configuration
JWT_SECRET="test_jwt_secret"

# Email Configuration
RESEND_API_KEY="test_resend_api_key"
RESEND_FROM_EMAIL="ShelfSpot <test@local.app>"
ALERT_EMAIL_RECIPIENT="admin@local.app"
EOF
fi

# Execute the main process
exec "$@"