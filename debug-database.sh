#!/bin/bash

# Database connectivity troubleshooting script for ShelfSpot Unified Container

echo "🔍 ShelfSpot Database Connectivity Diagnostic"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Check if .env file exists
if [ ! -f "./backend/.env" ]; then
    print_error "Backend .env file not found!"
    exit 1
fi

# Extract database URL
DATABASE_URL=$(grep "DATABASE_URL" ./backend/.env | cut -d'=' -f2 | tr -d '"')

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not found in backend/.env"
    exit 1
fi

print_status "Found DATABASE_URL: $DATABASE_URL"

# Parse database URL to extract host and port
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

print_status "Database Host: $DB_HOST"
print_status "Database Port: $DB_PORT"

# Test connectivity from host
echo ""
print_status "Testing database connectivity from host..."

if command -v mysql &> /dev/null; then
    echo "Using mysql client to test connection..."
    # Extract user, password, and database from URL
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/mysql:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/mysql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" "$DB_NAME" 2>/dev/null; then
        print_status "✅ Database connection successful from host!"
    else
        print_error "❌ Cannot connect to database from host"
        print_warning "Please check your database server and credentials"
    fi
elif command -v nc &> /dev/null; then
    echo "Using netcat to test port connectivity..."
    if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
        print_status "✅ Port $DB_PORT is open on $DB_HOST"
    else
        print_error "❌ Cannot reach $DB_HOST:$DB_PORT"
        print_warning "Please check if your database server is running"
    fi
else
    print_warning "Neither mysql client nor netcat found. Cannot test connectivity."
fi

# Test from container
echo ""
print_status "Testing database connectivity from container..."

if docker ps | grep -q "shelfspot-unified"; then
    print_status "Container is running. Testing connectivity..."
    
    if docker exec shelfspot-unified nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
        print_status "✅ Container can reach database host:port"
    else
        print_error "❌ Container cannot reach database"
        print_warning "This might be a network configuration issue"
    fi
    
    # Test DNS resolution
    if docker exec shelfspot-unified nslookup "$DB_HOST" &>/dev/null; then
        print_status "✅ Container can resolve database hostname"
    else
        print_error "❌ Container cannot resolve database hostname"
    fi
    
else
    print_warning "Unified container is not running"
fi

# Provide solutions
echo ""
print_status "🛠️  Potential Solutions:"
echo ""

echo "1. If using host network mode:"
echo "   - Ensure your DATABASE_URL points to the correct IP/hostname"
echo "   - Use: docker-compose -f docker-compose.unified.yml up -d"

echo ""
echo "2. If using bridge network mode:"
echo "   - Make sure the database IP (192.168.1.2) is accessible from Docker"
echo "   - You might need to use host.docker.internal or the host's IP"

echo ""
echo "3. Alternative DATABASE_URL formats to try:"
echo "   - mysql://user:pass@host.docker.internal:3306/dbname"
echo "   - mysql://user:pass@$(hostname -I | awk '{print $1}'):3306/dbname"
echo "   - mysql://user:pass@192.168.1.2:3306/dbname (current)"

echo ""
echo "4. Debug container issues:"
echo "   docker logs shelfspot-unified"
echo "   docker exec -it shelfspot-unified sh"

echo ""
print_status "Run this script again after making changes to verify connectivity."
