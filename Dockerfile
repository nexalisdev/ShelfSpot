# Multi-stage Dockerfile to build and run both frontend and backend in a single container

# Stage 1: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Copy backend package files
COPY backend/package.json backend/yarn.lock ./
RUN apk add --no-cache libc6-compat && \
    yarn install --frozen-lockfile --production=false

# Copy backend source and build
COPY backend/ .
RUN yarn prisma generate && \
    yarn build

# Stage 2: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/yarn.lock ./
RUN apk add --no-cache libc6-compat && \
    yarn install --frozen-lockfile --production=false

# Copy frontend source and build
COPY frontend/ .
RUN yarn prisma generate && \
    yarn build

# Stage 3: Production Dependencies for Backend
FROM node:20-alpine AS backend-prod-deps
WORKDIR /app/backend

COPY backend/package.json backend/yarn.lock ./
COPY backend/prisma ./prisma

RUN yarn install --production --frozen-lockfile && \
    npx prisma generate && \
    yarn cache clean

# Stage 4: Final Runtime Image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install PM2 globally to manage both processes
RUN npm install -g pm2

# Create user
RUN addgroup --system --gid 1001 shelfspot && \
    adduser --system --uid 1001 shelfspot

# Copy backend built files
COPY --from=backend-builder --chown=shelfspot:shelfspot /app/backend/dist ./backend/dist
COPY --from=backend-prod-deps --chown=shelfspot:shelfspot /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=shelfspot:shelfspot /app/backend/prisma ./backend/prisma
COPY --from=backend-builder --chown=shelfspot:shelfspot /app/backend/package.json ./backend/
COPY --from=backend-builder --chown=shelfspot:shelfspot /app/backend/docker-entrypoint.sh ./backend/

# Copy frontend built files
COPY --from=frontend-builder --chown=shelfspot:shelfspot /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-builder --chown=shelfspot:shelfspot /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder --chown=shelfspot:shelfspot /app/frontend/public ./frontend/public
COPY --from=frontend-builder --chown=shelfspot:shelfspot /app/frontend/prisma ./frontend/prisma

# Create PM2 ecosystem file
COPY <<EOF ./ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'backend',
      script: './backend/dist/main.js',
      cwd: '/app',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'frontend',
      script: './frontend/server.js',
      cwd: '/app',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_BACKEND_URL: 'http://localhost:3001'
      },
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
EOF

# Create startup script
COPY <<EOF ./start.sh
#!/bin/sh

echo "Starting ShelfSpot Unified Container..."

# Debug: Show environment variables
echo "Database URL: \$DATABASE_URL"

# Wait for database to be ready (backend migrations)
echo "Waiting for database to be ready..."
cd /app/backend

# Test database connectivity first
echo "Testing database connectivity..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Database is unavailable - waiting 5 seconds..."
  echo "Current DATABASE_URL: \$DATABASE_URL"
  sleep 5
done

echo "Database is ready!"

# Apply Prisma migrations
echo "Applying database migrations..."
npx prisma migrate deploy

cd /app

# Start both services with PM2
echo "Starting frontend and backend services..."
exec pm2-runtime start ecosystem.config.js
EOF

# Make scripts executable
RUN chmod +x ./start.sh ./backend/docker-entrypoint.sh

# Set ownership
RUN chown -R shelfspot:shelfspot /app

USER shelfspot

# Expose only the frontend port
EXPOSE 3000
ENV PORT=3000

CMD ["./start.sh"]
