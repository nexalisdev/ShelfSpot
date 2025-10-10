# ShelfSpot Unified Container

This setup builds both the frontend and backend into a single Docker container, eliminating container communication issues and simplifying deployment.

## Architecture

- **Single Container**: Both frontend (Next.js) and backend (NestJS) run in the same container
- **Process Management**: PM2 manages both processes
- **Port Exposure**: Only port 3000 (frontend) is exposed
- **API Proxying**: Frontend proxies API calls to backend via localhost:3001

## Quick Start

### 1. Environment Setup

Ensure you have the required environment files:

```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database and configuration

# Frontend environment
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

### 2. Build and Run

```bash
# Build the unified container
./build-unified.sh

# Run with docker-compose (recommended)
docker-compose -f docker-compose.unified.yml up -d

# Or run directly
docker run -d \
  --name shelfspot \
  -p 3000:3000 \
  --env-file ./backend/.env \
  --env-file ./frontend/.env \
  shelfspot-unified
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api/\* (proxied to internal backend)

## Benefits

1. **No Container Communication Issues**: Everything runs localhost
2. **Simplified Deployment**: Single container to manage
3. **Reduced Resource Usage**: Shared base image and dependencies
4. **Easier Development**: One container to start/stop
5. **Network Simplicity**: No inter-container networking required

## Container Structure

```
/app/
├── backend/           # NestJS backend files
│   ├── dist/         # Compiled backend
│   ├── node_modules/ # Backend dependencies
│   └── prisma/       # Database schema and migrations
├── frontend/         # Next.js frontend files
│   ├── .next/        # Compiled frontend
│   ├── public/       # Static assets
│   └── prisma/       # Frontend Prisma client
├── ecosystem.config.js  # PM2 configuration
└── start.sh          # Startup script
```

## Process Management

The container uses PM2 to manage both processes:

- **backend**: NestJS API server on port 3001
- **frontend**: Next.js server on port 3000

### Monitoring

```bash
# View container logs
docker logs shelfspot

# Execute into container
docker exec -it shelfspot sh

# View PM2 status (inside container)
pm2 status

# View individual process logs
pm2 logs backend
pm2 logs frontend
```

## Troubleshooting

### Database Connection Issues

Ensure your database is accessible from the Docker container. Update the `DATABASE_URL` in your backend `.env` file.

### Frontend API Issues

The frontend automatically proxies `/api/*` requests to the backend. If you encounter issues:

1. Check that both processes are running: `docker exec -it shelfspot pm2 status`
2. Verify backend health: `docker exec -it shelfspot wget -O- http://localhost:3001/health`
3. Check logs: `docker logs shelfspot`

### Memory Issues

If the container uses too much memory, you can:

1. Adjust PM2 memory limits in `ecosystem.config.js`
2. Add Docker memory limits: `docker run --memory=1g ...`

## Migration from Separate Containers

If you're migrating from separate frontend/backend containers:

1. Stop existing containers
2. Update any external services to point to port 3000 instead of 3001
3. Remove backend port mappings from reverse proxies
4. Update API URLs in frontend to use relative paths (`/api/...`)

## Development vs Production

This unified container is optimized for production. For development, continue using:

```bash
# Backend development
cd backend && npm run start:dev

# Frontend development
cd frontend && npm run dev
```
