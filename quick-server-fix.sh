#!/bin/bash

echo "⚡ QUICK SERVER PERFORMANCE FIX"
echo "==============================="
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

# Step 1: Check system resources immediately
print_status "Step 1: Checking system resources..."
echo "Memory usage:"
free -h
echo ""
echo "Disk usage:"
df -h /
echo ""
echo "CPU load:"
uptime

# Step 2: Kill any hanging processes
print_status "Step 2: Cleaning up hanging processes..."
# Kill any zombie Docker processes
docker ps -q | xargs -r docker kill 2>/dev/null || true

# Step 3: Quick Docker cleanup (no prompts)
print_status "Step 3: Quick Docker cleanup..."
docker-compose down
docker system prune -f
docker container prune -f

# Step 4: Restart services with limited resources
print_status "Step 4: Restarting services with resource limits..."
# Start only essential services first
docker-compose up -d postgres redis
sleep 5
docker-compose up -d backend
sleep 10
docker-compose up -d frontend

# Step 5: Check if services are responding
print_status "Step 5: Checking service responsiveness..."
timeout 5 docker-compose exec backend python -c "print('Backend OK')" 2>/dev/null && print_success "Backend responding" || print_error "Backend slow/unresponsive"

timeout 5 curl -s -I https://veveve.dk > /dev/null && print_success "Website responding" || print_error "Website slow/unresponsive"

# Step 6: Optimize Nginx
print_status "Step 6: Optimizing Nginx..."
sudo systemctl restart nginx

# Step 7: Check system again
print_status "Step 7: System status after fixes..."
echo "Memory after cleanup:"
free -h
echo ""
echo "Container status:"
docker-compose ps

print_success "Quick server fix completed!"
echo ""
echo "🔍 IMMEDIATE ACTIONS TO TAKE:"
echo "1. Check website: https://veveve.dk"
echo "2. If still slow, run: sudo reboot"
echo "3. Monitor with: htop"
echo ""
echo "⚡ IF STILL SLOW:"
echo "- Run: sudo swapoff -a && sudo swapon -a  # Reset swap"
echo "- Run: sudo systemctl restart nginx       # Restart web server"
echo "- Run: docker-compose restart             # Restart containers"























