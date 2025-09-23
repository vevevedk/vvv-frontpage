#!/bin/bash

# VVV-Frontpage Deployment Fix Script
# Based on the successful fix for invest.veveve.dk

echo "🚀 Fixing VVV-Frontpage Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

print_status "Step 1: Stopping existing containers..."
docker-compose down

print_status "Step 2: Checking for port conflicts..."
if netstat -tlnp | grep -E ":(80|443)" | grep docker-proxy; then
    print_warning "Found Docker containers using ports 80/443 - this will be fixed"
fi

print_status "Step 3: Updating system nginx configuration..."

# Check if system nginx config exists
if [ -f "/etc/nginx/sites-available/veveve.dk" ]; then
    print_status "Backing up existing nginx config..."
    sudo cp /etc/nginx/sites-available/veveve.dk /etc/nginx/sites-available/veveve.dk.backup
fi

# Copy new nginx config
print_status "Installing new nginx configuration..."
sudo cp deploy/nginx-system.conf /etc/nginx/sites-available/veveve.dk

# Enable the site if not already enabled
if [ ! -L "/etc/nginx/sites-enabled/veveve.dk" ]; then
    print_status "Enabling nginx site..."
    sudo ln -s /etc/nginx/sites-available/veveve.dk /etc/nginx/sites-enabled/veveve.dk
fi

# Test nginx configuration
print_status "Testing nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

print_status "Step 4: Starting system nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

print_status "Step 5: Building and starting vvv-frontpage services..."
docker-compose up -d

print_status "Step 6: Waiting for services to start..."
sleep 15

print_status "Step 7: Checking service status..."
docker-compose ps

print_status "Step 8: Testing application..."

# Test local services
if curl -f -s http://localhost:8001/api/ > /dev/null; then
    print_status "Backend API is responding on localhost:8001"
else
    print_warning "Backend API not responding on localhost:8001"
fi

if curl -f -s http://localhost:3000 > /dev/null; then
    print_status "Frontend is responding on localhost:3000"
else
    print_warning "Frontend not responding on localhost:3000"
fi

# Test public domain
if curl -f -s https://veveve.dk > /dev/null; then
    print_status "Application is responding on https://veveve.dk"
else
    print_warning "Application not responding on https://veveve.dk"
fi

print_status "Step 9: Checking port usage..."
echo "Current port usage:"
sudo netstat -tlnp | grep -E ":(80|443|8001|3000)" || echo "No processes found on these ports"

print_status "Step 10: Showing recent logs..."
docker-compose logs --tail=20

echo ""
echo "🎉 VVV-Frontpage deployment fix completed!"
echo "=========================================="
echo "Your application should be available at:"
echo "  - https://veveve.dk"
echo "  - Backend API: http://localhost:8001"
echo "  - Frontend: http://localhost:3000"
echo ""
echo "Architecture:"
echo "  - System nginx handles SSL termination (ports 80/443)"
echo "  - vvv-frontpage backend: localhost:8001"
echo "  - vvv-frontpage frontend: localhost:3000"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To restart: docker-compose restart"
echo "To check nginx: sudo systemctl status nginx"

