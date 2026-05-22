# ShelfSpot – *Your Perfect Inventory*

**ShelfSpot** is an open-source, self-hosted home inventory application. Know what you own, where
it lives, and when to reorder — from any device, without sharing your data with a third party.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Core Features](#core-features)
4. [Deployment Guide](#deployment-guide)
   - [Option A — Setup Wizard (recommended)](#option-a--setup-wizard-recommended)
   - [Option B — Docker Compose manually](#option-b--docker-compose-manually)
   - [Option C — Local development (no Docker)](#option-c--local-development-no-docker)
   - [Nginx reverse proxy](#nginx-reverse-proxy)
   - [CLI installation](#cli-installation)
5. [CLI Usage Guide](#cli-usage-guide)
   - [Authentication](#authentication)
   - [Items](#items)
   - [Rooms](#rooms)
   - [Places](#places)
   - [Containers](#containers)
   - [Tags](#tags)
   - [Alerts](#alerts)
   - [Favourites](#favourites)
   - [Typical workflows](#typical-workflows)
6. [Configuration Reference](#configuration-reference)
7. [API Documentation](#api-documentation)
8. [Authentication System](#authentication-system)
9. [Frontend Architecture](#frontend-architecture)
10. [Mobile Integration](#mobile-integration)
11. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Frontend      │◄──►│    Backend      │◄──►│    Database      │
│   (Next.js 15)  │    │   (NestJS 11)   │    │  (PostgreSQL 15) │
└─────────────────┘    └─────────────────┘    └──────────────────┘
        │                       │
        ▼                       ▼
  Web Interface           REST API
  React 19                JWT Auth (55 min + 30-day refresh)
  Tailwind CSS 4          Swagger / OpenAPI 3.0
                          Prisma ORM + migrations
```

Default ports (all configurable):

| Service  | Port |
|----------|------|
| Frontend | 8083 |
| Backend  | 8082 |
| Database | 5432 |

---

## Technology Stack

### Backend
- **NestJS 11** · TypeScript 5 · Prisma 6 · PostgreSQL 15
- JWT authentication with Passport.js, bcrypt password hashing
- Email alerts via [Resend](https://resend.com)
- Push notifications via Expo Server SDK
- Swagger / OpenAPI documentation

### Frontend
- **Next.js 15** · React 19 · TypeScript 5 · Tailwind CSS 4
- Headless UI · Radix UI · Heroicons · Lucide
- Chart.js · React Hook Form + Zod validation

### Infrastructure
- Docker with multi-stage builds and PM2 process manager
- Docker Compose with deployment profiles (`backend`, `frontend`, `full`)
- Nginx reverse-proxy configuration included

---

## Core Features

- **Hierarchical inventory**: Room → Place → Container → Item
- **Threshold alerts**: email + mobile push when stock falls below a level
- **Projects & scoring**: importance algorithm based on active project usage
- **Multi-user**: role-based access, admin panel, password recovery
- **Analytics dashboard**: real-time metrics, value calculations, alert trends
- **Mobile-ready**: iPhone app with Expo push notifications
- **CLI tool**: `shelfspot` terminal client for scripting and quick lookups

---

## Deployment Guide

### Prerequisites

| Tool | Minimum | Notes |
|------|---------|-------|
| Docker | 24.x | with Compose v2 (`docker compose`) |
| Node.js | 18.x | only needed for the CLI or local dev |
| Git | any | — |

---

### Option A — Setup Wizard (recommended)

The setup wizard handles environment files, secrets, container builds, and optional CLI
installation in a single interactive session.

**Linux / macOS**

```bash
git clone https://github.com/your-org/shelfspot.git
cd shelfspot
chmod +x setup.sh
./setup.sh
```

**Windows (PowerShell as administrator)**

```powershell
git clone https://github.com/your-org/shelfspot.git
cd shelfspot
.\setup.ps1
```

The wizard presents five installation profiles:

| Choice | What it starts |
|--------|---------------|
| **1 — Full suite** | Database + Backend + Frontend + CLI |
| **2 — Backend stack** | Database + Backend API only |
| **3 — Frontend only** | Web app (backend hosted elsewhere) |
| **4 — CLI only** | Terminal client against an existing instance |
| **5 — Custom** | Pick individual components |

After the wizard completes, ShelfSpot is accessible at the ports you configured
(defaults: frontend → `http://localhost:8083`, backend → `http://localhost:8082`).

---

### Option B — Docker Compose manually

#### 1. Clone and configure environment files

```bash
git clone https://github.com/your-org/shelfspot.git
cd shelfspot
```

Create `.env` at the repository root:

```bash
# .env  (root)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=shelfspot
DB_PORT=5432
BACKEND_PORT=8082
FRONTEND_PORT=8083
NEXT_PUBLIC_BACKEND_URL=http://localhost:8082
```

Create `backend/.env`:

```bash
# backend/.env
DATABASE_URL="postgresql://postgres:change_me@db:5432/shelfspot"
JWT_SECRET="$(openssl rand -hex 48)"   # replace with your generated value

# Optional — email alerts via Resend
RESEND_API_KEY=""
RESEND_FROM_EMAIL="ShelfSpot <alerts@yourdomain.com>"
ALERT_EMAIL_RECIPIENT="admin@yourdomain.com"
```

> **Security**: generate a real JWT secret before production:
> ```bash
> openssl rand -hex 48
> ```

#### 2. Start the services

**Full stack** (database + backend + frontend):

```bash
docker compose --profile full up -d --build
```

**Backend only** (database + API):

```bash
docker compose --profile backend up -d --build
```

**Frontend only** (connect to an existing backend):

```bash
# Set NEXT_PUBLIC_BACKEND_URL in .env to your backend URL first
docker compose --profile frontend up -d --build
```

#### 3. Verify

```bash
docker compose ps                         # all containers healthy?
curl http://localhost:8082/auth/profile   # backend alive?
```

The backend automatically runs `prisma migrate deploy` on startup — no manual migration step
is needed.

#### Stopping / restarting

```bash
docker compose --profile full down        # stop (keeps volumes)
docker compose --profile full down -v     # stop and delete database volume
docker compose --profile full up -d       # restart without rebuilding
docker compose --profile full up -d --build  # restart with rebuild
```

#### Logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

#### Database backup and restore

```bash
# Backup
docker exec shelfspot_db pg_dump -U postgres shelfspot > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i shelfspot_db psql -U postgres shelfspot < backup.sql
```

---

### Option C — Local development (no Docker)

#### Prerequisites

- Node.js 20.x
- PostgreSQL 15 running locally (or via `docker compose --profile backend up -d db`)

#### Backend

```bash
cd backend

# Install dependencies
yarn

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your local Postgres instance

# Generate Prisma client and run migrations
yarn prisma generate
yarn prisma migrate dev

# Start in watch mode
yarn start:dev
```

The backend listens on port **8082** by default (`PORT` env var to override).

#### Frontend

```bash
cd frontend

# Install dependencies
yarn

# Configure environment
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8082" > .env.local

# Start dev server
yarn dev
```

The frontend listens on port **3000** in development (Next.js default).

#### Useful development commands

```bash
# Backend
yarn start:dev          # watch mode
yarn start:debug        # debug mode
yarn build              # production build
yarn test               # unit tests
yarn test:e2e           # end-to-end tests
yarn test:cov           # coverage
yarn lint               # ESLint
yarn prisma studio      # visual DB editor
yarn prisma migrate dev --name "add_my_field"   # create a migration

# Frontend
yarn dev                # dev server
yarn build              # production build
yarn lint               # ESLint
yarn type-check         # TypeScript check
```

---

### Nginx reverse proxy

The repository ships a ready-to-use Nginx config at `nginx/shelfspot.conf`.  
It exposes the frontend at `shelf.lan` and the API at `api.shelf.lan` on port 80.

**Install on Linux (Debian/Ubuntu)**

```bash
sudo cp nginx/shelfspot.conf /etc/nginx/sites-available/shelfspot
sudo ln -s /etc/nginx/sites-available/shelfspot /etc/nginx/sites-enabled/shelfspot
sudo nginx -t && sudo systemctl reload nginx
```

**DNS / hosts**

Add your server IP to DNS, or for a single-machine setup edit `/etc/hosts`
(Linux/macOS) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
192.168.1.10  shelf.lan
192.168.1.10  api.shelf.lan
```

Once Nginx is in place, set `SHELFSPOT_URL=http://api.shelf.lan` for the CLI and
keep `NEXT_PUBLIC_BACKEND_URL=http://backend:8082` (internal Docker network address)
for the frontend container.

**HTTPS / SSL**

The included config targets HTTP. To add TLS with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d shelf.lan -d api.shelf.lan
sudo systemctl reload nginx
```

For a local homelab with a self-signed certificate, replace the `listen 80` blocks
with `listen 443 ssl` and point `ssl_certificate` / `ssl_certificate_key` to your
cert files.

---

### CLI installation

The `shelfspot` CLI connects to any running ShelfSpot backend.

**Via the setup wizard** — the easiest path; choose "CLI only" or include it
with any other profile. The wizard builds, installs, and logs you in automatically.

**Manual installation**

```bash
cd cli
npm install
npm run build
npm pack
npm install -g shelfspot-*.tgz   # or: npm link
```

**Point the CLI at your instance**

```bash
# Linux / macOS — add to ~/.bashrc or ~/.zshrc for persistence
export SHELFSPOT_URL=http://api.shelf.lan   # or http://localhost:8082

# Windows PowerShell — persists across sessions
[System.Environment]::SetEnvironmentVariable("SHELFSPOT_URL","http://api.shelf.lan","User")
```

**First login**

```bash
shelfspot auth login     # prompts for email + password
shelfspot auth whoami    # verify session
```

Sessions are cached in `~/.shelfspot/session.json`. Access tokens are valid for
55 minutes and refresh automatically — you only need to log in once per month.

---

## CLI Usage Guide

The `shelfspot` CLI lets you manage your entire inventory from the terminal without opening a
browser. All commands return JSON — pipe through `jq` for filtering.

```bash
shelfspot --help          # list all commands
shelfspot <command> --help  # help for a specific command
```

### Authentication

Sessions are cached in `~/.shelfspot/session.json` and last up to **30 days** via automatic
token refresh. Log in once and the CLI stays connected.

```bash
shelfspot auth login      # prompt for email + password, cache session
shelfspot auth logout     # delete cached session
shelfspot auth whoami     # print the logged-in email (no network call)
shelfspot auth profile    # full profile object from the API
```

> If your session expires, run `shelfspot auth login` again.

---

### Items

Items are the core resource. Every item must belong to a room.

#### Read

```bash
shelfspot items list                   # all items
shelfspot items get <id>               # one item by ID
shelfspot items search "query"         # case-insensitive search on name, status, room, place
shelfspot items stats                  # distribution by status
shelfspot items value                  # { totalValue, itemsWithValue, totalItems }
```

#### Create

```bash
shelfspot items create \
  --name        "HDMI cable"   \   # required
  --quantity    3              \   # required
  --room-id     1              \   # required
  --place-id    2              \   # optional
  --container-id 1             \   # optional
  --status      "Available"    \   # optional (see status normalization below)
  --price       12.50          \   # optional — purchase price
  --sellprice   15.00          \   # optional — estimated / resale value
  --consumable  true           \   # optional — default: false
  --item-link   "https://..."      # optional — URL to product page
```

#### Update

All flags are optional; only supplied fields are changed.

```bash
shelfspot items update <id> \
  --name        "new name"         \
  --quantity    5                  \
  --room-id     2                  \
  --place-id    3                  \
  --container-id 2                 \
  --status      "Broken"           \
  --price       10.00              \
  --sellprice   8.00               \
  --item-link   "https://..."      \
  --tags        "electronics,fragile"   # replaces ALL existing tags; "" removes all
```

> `--tags` auto-creates any tag that does not yet exist.

#### Delete

```bash
shelfspot items delete <id>
```

#### Status normalization

The server normalizes status values for consistent statistics:

| Raw input (any case) | Normalized |
|---|---|
| `good`, `bon`, `available`, `disponible`, `ok` | Good |
| `damaged`, `endommagé`, `broken`, `cassé` | Damaged |
| `missing`, `manquant`, `lost`, `perdu` | Missing |
| `expired`, `expiré`, `old`, `ancien` | Expired |
| anything else | Capitalized as-is |
| empty / null | No Status |

#### Examples

```bash
shelfspot items create --name "Coffee beans" --quantity 5 --room-id 2 --consumable true
shelfspot items update 7 --quantity 3 --status "available"
shelfspot items update 7 --tags "food,pantry"
shelfspot items search "cable"
shelfspot items stats
shelfspot items value
shelfspot items list | jq '.[] | {id, name, quantity, room: .room.name}'
```

---

### Rooms

```bash
shelfspot rooms list
shelfspot rooms get <id>
shelfspot rooms create --name "Kitchen" [--description "Main kitchen"]
shelfspot rooms bulk-create --names "Garage,Attic,Basement"   # trims spaces
shelfspot rooms update <id> [--name "new name"] [--description "new desc"]
shelfspot rooms delete <id>
```

`bulk-create` creates all rooms in a single request and returns an array of created objects.

---

### Places

A place is a named spot inside a room (top shelf, left drawer, under the desk…).

```bash
shelfspot places list
shelfspot places get <id>
shelfspot places create --name "Top shelf" --room-id 1   # --room-id required
shelfspot places update <id> --name "Middle shelf"
shelfspot places delete <id>
```

---

### Containers

A container is a physical box, bin, or shelf unit that holds items.

```bash
shelfspot containers list
shelfspot containers get <id>
shelfspot containers create --name "Tool box" [--icon "box"] [--room-id 3] [--place-id 2]
shelfspot containers update <id> [--name] [--icon] [--room-id] [--place-id]
shelfspot containers delete <id>
```

`--icon` is a free-form string (`box`, `archive`, `bin`…). Stored as `null` when omitted.

---

### Tags

Tags are free-form labels assigned to items.

```bash
shelfspot tags list
shelfspot tags create --name "electronics"
shelfspot tags update <id> --name "new-name"
shelfspot tags delete <id>
```

Assign tags to items with `items update --tags`. This is the primary way to tag items —
`tags create` only registers the label globally.

```bash
shelfspot items update 5 --tags "electronics,fragile"   # replaces all tags on item 5
shelfspot items update 5 --tags ""                       # removes all tags from item 5
```

---

### Alerts

An alert fires (email + push notification) when an item's quantity falls **at or below** its
threshold. The same alert will not fire again within 24 hours. When quantity rises back above
the threshold, the alert auto-resets.

```bash
# List
shelfspot alerts list                    # all alerts
shelfspot alerts list --item-id 5        # alerts for a specific item

# Create
shelfspot alerts create \
  --item-id   5          \   # required
  --threshold 10         \   # required — fires when quantity <= this value
  --name      "Reorder"      # optional label

# Update
shelfspot alerts update <id> \
  --threshold 5          \
  --name      "new name" \
  --active    true           # true = enabled, false = paused

# Delete
shelfspot alerts delete <id>

# Manual trigger — checks all active alerts immediately (respects 24 h cooldown)
shelfspot alerts check

# Monthly statistics (last 12 months)
shelfspot alerts stats
```

---

### Favourites

```bash
shelfspot favs list              # list favourite items
shelfspot favs add <item-id>     # add item to favourites
shelfspot favs remove <item-id>  # remove item from favourites
```

`favs` and `favourites` are interchangeable aliases.

---

### Typical workflows

#### Setting up a new room from scratch

```bash
# 1. Create the room
shelfspot rooms create --name "Workshop"
# → { "id": 4, "name": "Workshop" }

# 2. Add places inside it
shelfspot places create --name "Pegboard"         --room-id 4
shelfspot places create --name "Workbench drawer" --room-id 4

# 3. Add a container
shelfspot containers create --name "Small parts bin" --room-id 4 --place-id 5

# 4. Add items
shelfspot items create --name "M3 screws" --quantity 200 \
  --room-id 4 --place-id 5 --container-id 1 --consumable true
```

#### Inventory audit

```bash
shelfspot items stats    # breakdown by status
shelfspot items value    # total purchase and estimated value
shelfspot items list | jq '.[] | {id, name, quantity, status, room: .room.name}'
```

#### Low-stock monitoring

```bash
# Set a reorder alert for item 12 when quantity drops to 5
shelfspot alerts create --item-id 12 --threshold 5 --name "Reorder M3 screws"

# Manually trigger all active alerts right now
shelfspot alerts check

# Check alert history
shelfspot alerts stats
```

#### Updating quantity after use

```bash
# Find the item
shelfspot items search "coffee beans"
# → [{ "id": 7, "name": "Coffee beans", "quantity": 5, … }]

# Update quantity
shelfspot items update 7 --quantity 3
# Alert fires automatically if the new quantity <= threshold
```

#### Moving an item to a different location

```bash
shelfspot items update 12 --room-id 2 --place-id 8 --container-id 3
```

#### Bulk room creation

```bash
shelfspot rooms bulk-create --names "Kitchen,Living room,Bedroom,Garage,Attic"
```

#### Output filtering with jq

```bash
# List items with only key fields
shelfspot items list | jq '.[] | {id, name, quantity, room: .room.name}'

# Get the ID of a specific item
shelfspot items search "hdmi" | jq '.[0].id'

# List items below quantity 5
shelfspot items list | jq '[.[] | select(.quantity < 5)] | {id, name, quantity}'

# Count items per room
shelfspot items list | jq 'group_by(.room.name) | map({room: .[0].room.name, count: length})'
```

---

## Configuration Reference

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Secret used to sign JWT tokens — generate with `openssl rand -hex 48` |
| `RESEND_API_KEY` | no | [Resend](https://resend.com) key for email alerts |
| `RESEND_FROM_EMAIL` | no | Sender address, e.g. `ShelfSpot <alerts@yourdomain.com>` |
| `ALERT_EMAIL_RECIPIENT` | no | Address that receives low-stock emails |
| `PORT` | no | Backend HTTP port (default `8082`) |
| `NODE_ENV` | no | Set to `production` in containers |

### Root `.env` (Docker Compose only)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `password` | PostgreSQL password |
| `POSTGRES_DB` | `shelfspot` | PostgreSQL database name |
| `DB_PORT` | `5432` | Host port mapped to the database container |
| `BACKEND_PORT` | `8082` | Host port mapped to the backend container |
| `FRONTEND_PORT` | `8083` | Host port mapped to the frontend container |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:8082` | Backend URL the **browser** uses to call the API |

### `frontend/.env.local` (local dev or frontend-only Docker)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL visible from the client browser |

---

## API Documentation

### Base URL

```
http://localhost:8082
```

### Swagger UI

```
http://localhost:8082/api/swagger
```

The Swagger UI is always available when the backend is running and lists every endpoint,
request schema, and response model.

### Quick test

```bash
# Health check
curl http://localhost:8082/health

# Login
curl -X POST http://localhost:8082/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}'

# Use the returned access_token in subsequent calls
curl -H "Authorization: Bearer <token>" http://localhost:8082/items
```

---

## Authentication System

### Token lifecycle

| Token | Validity | Storage |
|-------|----------|---------|
| Access token | 55 minutes | `Authorization: Bearer` header |
| Refresh token | 30 days | HTTP-only cookie or `~/.shelfspot/session.json` (CLI) |

The refresh token auto-rotates on each use. An active session stays alive indefinitely
as long as it is exercised at least once per month.

### JWT payload

```typescript
interface JwtPayload {
  sub: string;           // User ID
  email?: string;
  name?: string;
  admin?: boolean;
  notificationToken?: string;  // Expo push token
  iat?: number;
  exp?: number;
}
```

### Authentication flow

1. `POST /auth/login` → returns `{ access_token, refresh_token }`
2. Include `Authorization: Bearer <access_token>` on every authenticated request
3. On 401, call `POST /auth/refresh` with the refresh token to obtain a new pair
4. After 30 days of inactivity, log in again

---

## Frontend Architecture

```
frontend/src/
├── app/
│   ├── (auth)/            # login / register routes
│   └── (pages)/           # dashboard, inventory, manage, projects, settings
├── components/
│   ├── ui/                # base UI primitives
│   ├── forms/
│   ├── modals/
│   └── charts/
├── lib/
│   ├── backend-api.ts     # typed API client
│   ├── auth-context.tsx   # React auth context
│   └── utils.ts
└── hooks/                 # useApiData, useGetRooms, useGetProjects…
```

The API client reads `NEXT_PUBLIC_BACKEND_URL` at build time. In Docker the value is
baked in at image build — rebuild the frontend image whenever you change this variable.

---

## Troubleshooting

### Container does not start

```bash
docker compose logs backend   # look for migration or config errors
docker compose logs db        # look for postgres startup errors
```

### Database connection refused

```bash
# Check that the db container is healthy
docker inspect --format='{{.State.Health.Status}}' shelfspot_db

# Verify DATABASE_URL in backend/.env points to the correct host
# Inside docker-compose: @db:5432
# Outside (local dev): @localhost:5432
```

### Migrations failed

```bash
docker exec -it shelfspot_backend sh
cd /app/backend
npx prisma migrate deploy
```

### JWT / authentication errors

```bash
# Ensure JWT_SECRET is identical across restarts
# Check the token is valid
curl -H "Authorization: Bearer <token>" http://localhost:8082/auth/profile

# CLI: clear and re-authenticate
shelfspot auth logout
shelfspot auth login
```

### Frontend cannot reach the backend

- Check `NEXT_PUBLIC_BACKEND_URL` is set to the URL **the browser** can reach
  (not the internal Docker network address `http://backend:8082`).
- If using Nginx, make sure `api.shelf.lan` resolves and Nginx is running.
- Inspect the browser Network tab for failed OPTIONS (CORS) or 404 requests.

### Build failures

```bash
# Clear Docker build cache
docker compose --profile full build --no-cache

# Clear Next.js cache (local dev)
rm -rf frontend/.next

# Clear node_modules and reinstall
rm -rf backend/node_modules frontend/node_modules
yarn --cwd backend install
yarn --cwd frontend install
```

### Health endpoints

```bash
curl http://localhost:8082/health    # backend
curl http://localhost:8083           # frontend (HTTP 200 = ok)
```

---

## Support

- **API docs**: `http://localhost:8082/api/swagger` when the backend is running
- **Issues**: GitHub Issues for bug reports and feature requests
