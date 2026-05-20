#!/usr/bin/env bash
# ==============================================================================
# ShelfSpot Setup Wizard
# ==============================================================================
set -e

# ── Colours ───────────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  BOLD="\033[1m"; DIM="\033[2m"; RESET="\033[0m"
  CYAN="\033[36m"; GREEN="\033[32m"; YELLOW="\033[33m"; RED="\033[31m"; BLUE="\033[34m"
else
  BOLD=""; DIM=""; RESET=""; CYAN=""; GREEN=""; YELLOW=""; RED=""; BLUE=""
fi

banner()  { echo -e "\n${CYAN}${BOLD}$*${RESET}"; }
step()    { echo -e "\n${BLUE}${BOLD}▸ $*${RESET}"; }
info()    { echo -e "  ${DIM}$*${RESET}"; }
success() { echo -e "  ${GREEN}✓ $*${RESET}"; }
warn()    { echo -e "  ${YELLOW}⚠ $*${RESET}"; }
error()   { echo -e "\n${RED}${BOLD}✗ $*${RESET}" >&2; exit 1; }
ask()     { echo -e -n "  ${BOLD}$1${RESET} "; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Helpers ───────────────────────────────────────────────────────────────────
require_cmd() {
  if ! command -v "$1" &>/dev/null; then
    error "$1 is not installed. $2"
  fi
}

require_node() {
  require_cmd node "Install Node.js v18+ from https://nodejs.org"
  local v; v=$(node -e "process.stdout.write(process.versions.node)")
  local major; major=$(echo "$v" | cut -d. -f1)
  [ "$major" -ge 18 ] || error "Node.js v18+ required (found v$v). Please upgrade."
  success "Node.js v$v"
}

require_docker() {
  require_cmd docker "Install Docker from https://docs.docker.com/get-docker/"
  docker info &>/dev/null || error "Docker daemon is not running. Please start Docker and re-run."
  require_cmd "docker" ""
  docker compose version &>/dev/null || error "Docker Compose v2 is required. Update Docker Desktop or install the plugin."
  success "Docker $(docker --version | grep -oP '\d+\.\d+\.\d+')"
}

gen_secret() {
  # 48 random hex bytes
  if command -v openssl &>/dev/null; then
    openssl rand -hex 48
  else
    tr -dc 'a-f0-9' < /dev/urandom | head -c 96
  fi
}

prompt_default() {
  # prompt_default "Question" "default"  → reads into $REPLY, falls back to default
  local question="$1" default="$2"
  ask "${question} [${default}]:"
  read -r REPLY
  [ -z "$REPLY" ] && REPLY="$default"
}

prompt_required() {
  local question="$1"
  while true; do
    ask "${question}:"
    read -r REPLY
    [ -n "$REPLY" ] && return
    warn "This field is required."
  done
}

wait_healthy() {
  local service="$1" max="${2:-60}" i=0
  step "Waiting for $service to be healthy…"
  while [ $i -lt $max ]; do
    local status
    status=$(docker inspect --format='{{.State.Health.Status}}' "shelfspot_${service}" 2>/dev/null || echo "missing")
    case "$status" in
      healthy) success "$service is healthy"; return 0 ;;
      missing|"") info "Container not yet started…" ;;
      *) info "Status: $status" ;;
    esac
    sleep 3; (( i+=3 ))
  done
  warn "$service did not report healthy within ${max}s. It may still be starting."
}

write_backend_env() {
  local file="$SCRIPT_DIR/backend/.env"
  cat > "$file" <<EOF
DATABASE_URL="${DATABASE_URL}"
JWT_SECRET="${JWT_SECRET}"
RESEND_API_KEY="${RESEND_API_KEY:-}"
RESEND_FROM_EMAIL="${RESEND_FROM_EMAIL:-ShelfSpot <noreply@shelfspot.local>}"
ALERT_EMAIL_RECIPIENT="${ALERT_EMAIL_RECIPIENT:-}"
EOF
  success "backend/.env written"
}

write_root_env() {
  local file="$SCRIPT_DIR/.env"
  cat > "$file" <<EOF
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-password}
POSTGRES_DB=${POSTGRES_DB:-shelfspot}
DB_PORT=${DB_PORT:-5432}
BACKEND_PORT=${BACKEND_PORT:-8082}
FRONTEND_PORT=${FRONTEND_PORT:-8083}
NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL:-}
EOF
  success ".env written"
}

install_cli() {
  local url="$1"
  local cli_dir="$SCRIPT_DIR/cli"
  [ -d "$cli_dir" ] || error "cli/ directory not found."

  step "Building CLI…"
  (cd "$cli_dir" && npm install --silent && npm run build --silent)
  success "CLI built"

  step "Installing shelfspot command globally…"
  (cd "$cli_dir" && npm link 2>/dev/null) || (cd "$cli_dir" && npm link)
  success "shelfspot command installed"

  # Persist SHELFSPOT_URL
  local export_line="export SHELFSPOT_URL=\"${url}\""
  local profiles=("$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile")
  for p in "${profiles[@]}"; do
    if [ -f "$p" ]; then
      sed -i '/^export SHELFSPOT_URL=/d' "$p" 2>/dev/null || true
      echo "$export_line" >> "$p"
      success "SHELFSPOT_URL written to $p"
    fi
  done
  export SHELFSPOT_URL="$url"

  step "Logging in to ShelfSpot…"
  shelfspot auth login
}

# ══════════════════════════════════════════════════════════════════════════════
# BANNER
# ══════════════════════════════════════════════════════════════════════════════
clear
echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║        ShelfSpot Setup Wizard        ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${RESET}"
echo "  Inventory management — setup assistant"
echo ""

# ══════════════════════════════════════════════════════════════════════════════
# MAIN MENU
# ══════════════════════════════════════════════════════════════════════════════
echo -e "${BOLD}  What would you like to install?${RESET}"
echo ""
echo "    1)  Full suite       database + backend + frontend + CLI"
echo "    2)  Backend stack    database + backend API only"
echo "    3)  Frontend only    web app  (backend is hosted elsewhere)"
echo "    4)  CLI only         command-line tool, connects to an existing instance"
echo "    5)  Custom           pick individual components"
echo ""
ask "Choice [1-5]:"
read -r CHOICE

# ══════════════════════════════════════════════════════════════════════════════
# OPTION 1 — FULL SUITE
# ══════════════════════════════════════════════════════════════════════════════
if [ "$CHOICE" = "1" ]; then
  banner "Full Suite Setup"
  require_docker
  require_node

  step "Configuring ports"
  prompt_default "Backend port"  "8082"; BACKEND_PORT="$REPLY"
  prompt_default "Frontend port" "8083"; FRONTEND_PORT="$REPLY"
  prompt_default "Database port" "5432"; DB_PORT="$REPLY"

  step "Configuring database"
  prompt_default "Postgres user"     "postgres"; POSTGRES_USER="$REPLY"
  prompt_default "Postgres password" "password"; POSTGRES_PASSWORD="$REPLY"
  prompt_default "Postgres database" "shelfspot"; POSTGRES_DB="$REPLY"

  DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}"
  JWT_SECRET=$(gen_secret)
  success "JWT secret generated"

  step "Email alerts (optional — press Enter to skip)"
  info "Used to send low-stock alert emails via Resend."
  ask "Resend API key (leave blank to skip):"; read -r RESEND_API_KEY
  if [ -n "$RESEND_API_KEY" ]; then
    prompt_required "From email (e.g. alerts@yourdomain.com)"; RESEND_FROM_EMAIL="ShelfSpot <$REPLY>"
    prompt_required "Alert recipient email"; ALERT_EMAIL_RECIPIENT="$REPLY"
  fi

  NEXT_PUBLIC_BACKEND_URL="http://localhost:${BACKEND_PORT}"

  write_backend_env
  write_root_env

  step "Building and starting containers (this may take a few minutes)…"
  cd "$SCRIPT_DIR"
  docker compose --profile full up -d --build

  wait_healthy "db"

  echo ""
  success "ShelfSpot is running!"
  info "  Backend:  http://localhost:${BACKEND_PORT}"
  info "  Frontend: http://localhost:${FRONTEND_PORT}"
  info "  Swagger:  http://localhost:${BACKEND_PORT}/api/swagger"

  echo ""
  ask "Install the CLI tool on this machine? [Y/n]:"
  read -r INSTALL_CLI
  if [[ "$INSTALL_CLI" =~ ^[Nn]$ ]]; then
    echo ""
    success "Setup complete."
  else
    install_cli "http://localhost:${BACKEND_PORT}"
    echo ""
    success "Setup complete. Run 'shelfspot --help' to get started."
  fi

# ══════════════════════════════════════════════════════════════════════════════
# OPTION 2 — BACKEND STACK
# ══════════════════════════════════════════════════════════════════════════════
elif [ "$CHOICE" = "2" ]; then
  banner "Backend Stack Setup"
  require_docker

  step "Configuring ports"
  prompt_default "Backend port"  "8082"; BACKEND_PORT="$REPLY"
  prompt_default "Database port" "5432"; DB_PORT="$REPLY"

  step "Configuring database"
  prompt_default "Postgres user"     "postgres"; POSTGRES_USER="$REPLY"
  prompt_default "Postgres password" "password"; POSTGRES_PASSWORD="$REPLY"
  prompt_default "Postgres database" "shelfspot"; POSTGRES_DB="$REPLY"

  DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}"
  JWT_SECRET=$(gen_secret)
  success "JWT secret generated"

  step "Email alerts (optional — press Enter to skip)"
  ask "Resend API key (leave blank to skip):"; read -r RESEND_API_KEY
  if [ -n "$RESEND_API_KEY" ]; then
    prompt_required "From email"; RESEND_FROM_EMAIL="ShelfSpot <$REPLY>"
    prompt_required "Alert recipient email"; ALERT_EMAIL_RECIPIENT="$REPLY"
  fi

  NEXT_PUBLIC_BACKEND_URL=""
  FRONTEND_PORT="8083"

  write_backend_env
  write_root_env

  step "Building and starting containers…"
  cd "$SCRIPT_DIR"
  docker compose --profile backend up -d --build

  wait_healthy "db"

  echo ""
  success "Backend is running!"
  info "  API:     http://localhost:${BACKEND_PORT}"
  info "  Swagger: http://localhost:${BACKEND_PORT}/api/swagger"

  echo ""
  ask "Install the CLI tool on this machine? [Y/n]:"
  read -r INSTALL_CLI
  if [[ ! "$INSTALL_CLI" =~ ^[Nn]$ ]]; then
    require_node
    install_cli "http://localhost:${BACKEND_PORT}"
  fi

  echo ""
  success "Setup complete."

# ══════════════════════════════════════════════════════════════════════════════
# OPTION 3 — FRONTEND ONLY
# ══════════════════════════════════════════════════════════════════════════════
elif [ "$CHOICE" = "3" ]; then
  banner "Frontend Setup"
  require_docker

  step "Backend connection"
  prompt_required "Backend URL (e.g. http://192.168.1.10:8082)"
  BACKEND_URL="${REPLY%/}"

  step "Configuring port"
  prompt_default "Frontend port" "8083"; FRONTEND_PORT="$REPLY"

  POSTGRES_USER="postgres"; POSTGRES_PASSWORD="password"
  POSTGRES_DB="shelfspot"; DB_PORT="5432"; BACKEND_PORT="8082"
  DATABASE_URL=""; JWT_SECRET=""; RESEND_API_KEY=""
  NEXT_PUBLIC_BACKEND_URL="$BACKEND_URL"

  write_root_env

  # Write a minimal frontend .env for the build
  echo "NEXT_PUBLIC_BACKEND_URL=${BACKEND_URL}" > "$SCRIPT_DIR/frontend/.env.local"
  success "frontend/.env.local written"

  step "Building and starting frontend container…"
  cd "$SCRIPT_DIR"
  docker compose --profile frontend up -d --build

  echo ""
  success "Frontend is running at http://localhost:${FRONTEND_PORT}"
  info "  Connecting to backend: ${BACKEND_URL}"
  echo ""
  success "Setup complete."

# ══════════════════════════════════════════════════════════════════════════════
# OPTION 4 — CLI ONLY
# ══════════════════════════════════════════════════════════════════════════════
elif [ "$CHOICE" = "4" ]; then
  banner "CLI Setup"
  require_node

  step "ShelfSpot instance URL"
  echo ""
  info "Examples:  http://192.168.1.100:8082"
  info "           https://shelfspot.myhome.net"
  info "           http://localhost:8082"
  echo ""
  prompt_required "ShelfSpot URL"
  SHELFSPOT_URL="${REPLY%/}"

  step "Testing connection…"
  if curl -sf --max-time 5 "${SHELFSPOT_URL}/auth/profile" -o /dev/null 2>/dev/null || \
     curl -sf --max-time 5 "${SHELFSPOT_URL}" -o /dev/null 2>/dev/null; then
    success "ShelfSpot is reachable"
  else
    warn "Could not reach ${SHELFSPOT_URL}. Make sure the server is running."
    ask "Continue anyway? [y/N]:"
    read -r CONT
    [[ "$CONT" =~ ^[Yy]$ ]] || exit 0
  fi

  install_cli "$SHELFSPOT_URL"

  echo ""
  success "CLI ready. Run 'shelfspot --help' to get started."

# ══════════════════════════════════════════════════════════════════════════════
# OPTION 5 — CUSTOM
# ══════════════════════════════════════════════════════════════════════════════
elif [ "$CHOICE" = "5" ]; then
  banner "Custom Setup"
  echo ""
  echo "  Select the components to install (y/n for each):"
  echo ""

  ask "Database (PostgreSQL via Docker)? [Y/n]:"; read -r DO_DB
  ask "Backend API (Docker)?             [Y/n]:"; read -r DO_BACKEND
  ask "Frontend web app (Docker)?        [Y/n]:"; read -r DO_FRONTEND
  ask "CLI tool?                         [Y/n]:"; read -r DO_CLI

  DO_DB=[[ ! "$DO_DB" =~ ^[Nn]$ ]]
  WANTS_DB=$([[ ! "$DO_DB" =~ ^[Nn]$ ]] && echo true || echo false)
  WANTS_BACKEND=$([[ ! "$DO_BACKEND" =~ ^[Nn]$ ]] && echo true || echo false)
  WANTS_FRONTEND=$([[ ! "$DO_FRONTEND" =~ ^[Nn]$ ]] && echo true || echo false)
  WANTS_CLI=$([[ ! "$DO_CLI" =~ ^[Nn]$ ]] && echo true || echo false)

  # Collect config only for what's needed
  NEEDS_DOCKER=false
  $WANTS_DB      && NEEDS_DOCKER=true
  $WANTS_BACKEND && NEEDS_DOCKER=true
  $WANTS_FRONTEND && NEEDS_DOCKER=true

  $NEEDS_DOCKER && require_docker
  $WANTS_CLI    && require_node

  POSTGRES_USER="postgres"; POSTGRES_PASSWORD="password"
  POSTGRES_DB="shelfspot";  DB_PORT="5432"
  BACKEND_PORT="8082"; FRONTEND_PORT="8083"
  DATABASE_URL="postgresql://postgres:password@db:5432/shelfspot"
  JWT_SECRET=""; RESEND_API_KEY=""; RESEND_FROM_EMAIL=""; ALERT_EMAIL_RECIPIENT=""
  NEXT_PUBLIC_BACKEND_URL=""

  if $WANTS_DB || $WANTS_BACKEND; then
    step "Configuring database"
    prompt_default "Postgres user"     "postgres"; POSTGRES_USER="$REPLY"
    prompt_default "Postgres password" "password"; POSTGRES_PASSWORD="$REPLY"
    prompt_default "Postgres database" "shelfspot"; POSTGRES_DB="$REPLY"
    prompt_default "Database port"     "5432"; DB_PORT="$REPLY"
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}"
  fi

  if $WANTS_BACKEND; then
    prompt_default "Backend port" "8082"; BACKEND_PORT="$REPLY"
    JWT_SECRET=$(gen_secret)
    success "JWT secret generated"
    ask "Resend API key (leave blank to skip):"; read -r RESEND_API_KEY
    if [ -n "$RESEND_API_KEY" ]; then
      prompt_required "From email"; RESEND_FROM_EMAIL="ShelfSpot <$REPLY>"
      prompt_required "Alert recipient email"; ALERT_EMAIL_RECIPIENT="$REPLY"
    fi
    write_backend_env
  fi

  if $WANTS_FRONTEND; then
    prompt_default "Frontend port" "8083"; FRONTEND_PORT="$REPLY"
    if ! $WANTS_BACKEND; then
      prompt_required "Backend URL (e.g. http://192.168.1.10:8082)"
      NEXT_PUBLIC_BACKEND_URL="${REPLY%/}"
    else
      NEXT_PUBLIC_BACKEND_URL="http://localhost:${BACKEND_PORT}"
    fi
    echo "NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}" > "$SCRIPT_DIR/frontend/.env.local"
    success "frontend/.env.local written"
  fi

  write_root_env

  # Determine which Docker profiles to activate
  if $NEEDS_DOCKER; then
    PROFILES=()
    ($WANTS_DB || $WANTS_BACKEND) && PROFILES+=("backend")
    $WANTS_FRONTEND && PROFILES+=("frontend")

    PROFILE_ARGS=""
    for p in "${PROFILES[@]}"; do PROFILE_ARGS="$PROFILE_ARGS --profile $p"; done

    step "Starting selected containers…"
    cd "$SCRIPT_DIR"
    # shellcheck disable=SC2086
    docker compose $PROFILE_ARGS up -d --build

    ($WANTS_DB || $WANTS_BACKEND) && wait_healthy "db"
  fi

  if $WANTS_CLI; then
    if $WANTS_BACKEND; then
      CLI_URL="http://localhost:${BACKEND_PORT}"
    else
      echo ""
      prompt_required "ShelfSpot URL to connect the CLI to"
      CLI_URL="${REPLY%/}"
    fi
    install_cli "$CLI_URL"
  fi

  echo ""
  success "Custom setup complete."
  $WANTS_BACKEND  && info "  API:      http://localhost:${BACKEND_PORT}"
  $WANTS_FRONTEND && info "  Frontend: http://localhost:${FRONTEND_PORT}"

else
  error "Invalid choice: $CHOICE"
fi

echo ""
