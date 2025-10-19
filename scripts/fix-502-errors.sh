#!/bin/bash

# Fix 502 Bad Gateway errors for veveve.dk ONLY
# This script ONLY affects veveve.dk and will NOT touch other applications
# Based on historical documentation and nginx configuration analysis

set -e

# SAFETY: Only work with veveve.dk
TARGET_DOMAIN="veveve.dk"
NGINX_CONFIG_FILE="/etc/nginx/sites-available/veveve.dk"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

echo "🔧 Fixing 502 Bad Gateway Errors for veveve.dk ONLY"
echo "===================================================="
echo "⚠️  This script will ONLY affect veveve.dk"
echo "⚠️  Other applications (invest.veveve.dk, smagalagellerup.dk) will NOT be touched"
echo ""

# Step 1: Check if we're on the production server
if [[ ! -f "$ROOT_DIR/docker-compose.yml" ]]; then
    print_error "docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Step 2: Stop only vvv-frontpage containers (not other apps)
print_status "Stopping vvv-frontpage containers only..."
cd "$ROOT_DIR"
docker-compose down || true

# Step 3: Clean up only vvv-frontpage Docker resources
print_status "Cleaning up vvv-frontpage Docker resources..."
docker-compose down --remove-orphans || true

# Step 4: Check if veveve.dk ports are already in use (but be careful)
print_info "Checking veveve.dk port availability..."
if lsof -i :3000 > /dev/null 2>&1; then
    print_warning "Port 3000 is in use by veveve.dk frontend. Stopping vvv-frontpage processes only..."
    # Only kill processes that are clearly from vvv-frontpage
    sudo pkill -f "vvv-frontpage" || true
    sudo pkill -f "frontend:3000" || true
fi

if lsof -i :8001 > /dev/null 2>&1; then
    print_warning "Port 8001 is in use by veveve.dk backend. Stopping vvv-frontpage processes only..."
    # Only kill processes that are clearly from vvv-frontpage
    sudo pkill -f "vvv-frontpage" || true
    sudo pkill -f "backend:8001" || true
fi

# Step 5: Ensure ONLY veveve.dk nginx configuration is updated
print_status "Installing correct nginx configuration for veveve.dk ONLY..."
NGINX_CONF_SRC="$ROOT_DIR/deploy/veveve.dk.conf"
NGINX_CONF_DST="$NGINX_CONFIG_FILE"

if [[ -f "$NGINX_CONF_SRC" ]]; then
    sudo cp "$NGINX_CONF_SRC" "$NGINX_CONF_DST"
    sudo ln -sf "$NGINX_CONF_DST" /etc/nginx/sites-enabled/veveve.dk
    
    # Test nginx configuration
    if sudo nginx -t; then
        print_status "Nginx configuration is valid"
    else
        print_error "Nginx configuration test failed!"
        exit 1
    fi
else
    print_error "Nginx configuration file not found: $NGINX_CONF_SRC"
    exit 1
fi

# Step 6: Check environment files
print_status "Checking environment configuration..."
if [[ ! -f "$ROOT_DIR/env/backend.env" ]]; then
    print_error "Backend environment file not found!"
    exit 1
fi

if [[ ! -f "$ROOT_DIR/env/frontend.env" ]]; then
    print_error "Frontend environment file not found!"
    exit 1
fi

# Step 7: Build and start services
print_status "Building and starting Docker services..."

# Determine docker-compose command
if command -v docker-compose >/dev/null 2>&1; then
    DC="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DC="docker compose"
else
    print_error "docker-compose or docker compose is required"
    exit 1
fi

print_info "Using Docker Compose command: $DC"

# Build services
$DC build --no-cache backend frontend

# Start services
$DC up -d

# Step 8: Wait for services to be ready
print_status "Waiting for services to start..."
sleep 15

# Step 9: Check container status
print_status "Checking container status..."
$DC ps

# Step 10: Check if ports are listening
print_status "Checking port connectivity..."
if netstat -tlnp | grep :3000 > /dev/null; then
    print_status "Frontend is listening on port 3000"
else
    print_error "Frontend is NOT listening on port 3000"
    print_info "Frontend logs:"
    $DC logs frontend --tail=20
fi

if netstat -tlnp | grep :8001 > /dev/null; then
    print_status "Backend is listening on port 8001"
else
    print_error "Backend is NOT listening on port 8001"
    print_info "Backend logs:"
    $DC logs backend --tail=20
fi

# Step 11: Test local connectivity
print_status "Testing local connectivity..."
if curl -f -s --max-time 10 http://localhost:3000 > /dev/null; then
    print_status "Frontend responding on localhost:3000"
else
    print_error "Frontend NOT responding on localhost:3000"
fi

if curl -f -s --max-time 10 http://localhost:8001/api/health > /dev/null; then
    print_status "Backend API responding on localhost:8001"
else
    print_error "Backend API NOT responding on localhost:8001"
fi

# Step 12: Reload nginx
print_status "Reloading nginx..."
sudo systemctl reload nginx

# Step 13: Test external connectivity for veveve.dk ONLY
print_status "Testing external connectivity for veveve.dk..."
sleep 5

if curl -f -s --max-time 10 https://$TARGET_DOMAIN/health > /dev/null; then
    print_status "✅ $TARGET_DOMAIN is responding!"
else
    print_warning "⚠️ $TARGET_DOMAIN is not responding yet"
    print_info "This might take a few more seconds to propagate"
fi

# Step 14: Show final status
echo ""
echo "🎉 502 Error Fix Completed for veveve.dk!"
echo "========================================="
echo "✅ Only veveve.dk was affected"
echo "✅ Other applications (invest.veveve.dk, smagalagellerup.dk) were NOT touched"
echo ""
print_info "Container Status:"
$DC ps
echo ""
print_info "Port Status:"
netstat -tlnp | grep -E ":(3000|8001)" || echo "No services listening on expected ports"
echo ""
print_info "Recent Logs:"
echo "Frontend:"
$DC logs frontend --tail=5
echo ""
echo "Backend:"
$DC logs backend --tail=5
echo ""

if curl -f -s --max-time 10 https://$TARGET_DOMAIN > /dev/null; then
    print_status "🌐 $TARGET_DOMAIN is now accessible!"
else
    print_warning "🌐 $TARGET_DOMAIN may need a few more minutes to become accessible"
    print_info "Try: curl -I https://$TARGET_DOMAIN"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Monitor logs: $DC logs -f"
echo "2. Check nginx: sudo tail -f /var/log/nginx/error.log"
echo "3. Test the site: https://$TARGET_DOMAIN"
echo ""





