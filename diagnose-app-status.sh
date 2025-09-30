#!/bin/bash

echo "🔍 COMPREHENSIVE APP STATUS DIAGNOSIS"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Check container status
print_status "Step 1: Checking container status..."
docker-compose ps

echo ""

# Step 2: Check if containers are running
print_status "Step 2: Checking if all containers are up..."
running_containers=$(docker-compose ps --services --filter "status=running")
total_services=$(docker-compose ps --services | wc -l)
running_count=$(echo "$running_containers" | wc -l)

if [ "$running_count" -eq "$total_services" ]; then
    print_success "All $total_services containers are running"
else
    print_error "Only $running_count out of $total_services containers are running"
    print_status "Running containers: $running_containers"
fi

# Step 3: Check website accessibility
print_status "Step 3: Testing website accessibility..."
if curl -s -I https://veveve.dk | grep -q "200\|301\|302"; then
    print_success "Website is accessible via HTTPS"
else
    print_error "Website is not accessible via HTTPS"
    print_status "Trying HTTP..."
    if curl -s -I http://veveve.dk | grep -q "200\|301\|302"; then
        print_warning "Website accessible via HTTP (should redirect to HTTPS)"
    else
        print_error "Website not accessible via HTTP either"
    fi
fi

# Step 4: Check Nginx status
print_status "Step 4: Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
    print_status "Starting Nginx..."
    sudo systemctl start nginx
fi

# Step 5: Check Docker containers health
print_status "Step 5: Checking container health..."

# Check frontend
if docker-compose exec frontend wget -qO- http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend container is responding"
else
    print_error "Frontend container is not responding"
fi

# Check backend
if docker-compose exec backend python manage.py shell -c "from django.db import connection; connection.ensure_connection(); print('OK')" > /dev/null 2>&1; then
    print_success "Backend container is responding"
else
    print_error "Backend container is not responding"
fi

# Check database
if docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database is accessible"
else
    print_error "Database is not accessible"
fi

# Step 6: Check recent logs for errors
print_status "Step 6: Checking recent logs for errors..."

echo ""
print_status "Frontend logs (last 10 lines):"
docker-compose logs frontend --tail=10 2>/dev/null || print_error "Cannot get frontend logs"

echo ""
print_status "Backend logs (last 10 lines):"
docker-compose logs backend --tail=10 2>/dev/null || print_error "Cannot get backend logs"

echo ""
print_status "Postgres logs (last 5 lines):"
docker-compose logs postgres --tail=5 2>/dev/null || print_error "Cannot get postgres logs"

# Step 7: Check port accessibility
print_status "Step 7: Checking port accessibility..."
if netstat -tlnp | grep -q ":80 "; then
    print_success "Port 80 is listening"
else
    print_error "Port 80 is not listening"
fi

if netstat -tlnp | grep -q ":443 "; then
    print_success "Port 443 is listening"
else
    print_error "Port 443 is not listening"
fi

# Step 8: Check disk space
print_status "Step 8: Checking disk space..."
df -h / | tail -1 | awk '{print "Disk usage: " $5 " (" $3 "/" $2 ")"}'

# Step 9: Check memory usage
print_status "Step 9: Checking memory usage..."
free -h | grep "Mem:" | awk '{print "Memory usage: " $3 "/" $2 " (" int($3/$2*100) "%)"}'

echo ""
echo "🔧 QUICK FIXES TO TRY:"
echo "1. Restart all services: docker-compose restart"
echo "2. Restart Nginx: sudo systemctl restart nginx"
echo "3. Check website: https://veveve.dk"
echo "4. Check container logs: docker-compose logs [service] --tail=20"
echo ""
echo "📋 NEXT STEPS:"
echo "If issues persist, run:"
echo "- docker-compose down && docker-compose up -d"
echo "- Check system resources: top, df -h, free -h"
echo "- Check Nginx config: sudo nginx -t"
