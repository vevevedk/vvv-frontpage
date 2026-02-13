#!/bin/bash

echo "🧹 DOCKER CLEANUP & PRUNING"
echo "==========================="
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

# Step 1: Stop all containers first
print_status "Step 1: Stopping all containers..."
docker-compose down

# Step 2: Show current Docker usage
print_status "Step 2: Current Docker usage..."
echo "Docker system info:"
docker system df

echo ""
print_status "Current images:"
docker images | head -10

echo ""
print_status "Current containers:"
docker ps -a | head -10

echo ""
print_status "Current volumes:"
docker volume ls | head -10

# Step 3: Remove unused containers
print_status "Step 3: Removing stopped containers..."
docker container prune -f

# Step 4: Remove unused images
print_status "Step 4: Removing unused images..."
docker image prune -f

# Step 5: Remove unused volumes (be careful with this)
print_status "Step 5: Removing unused volumes..."
print_warning "This will remove unused volumes. Data in unused volumes will be lost!"
read -p "Continue with volume pruning? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker volume prune -f
    print_success "Unused volumes removed"
else
    print_status "Skipping volume pruning"
fi

# Step 6: Remove unused networks
print_status "Step 6: Removing unused networks..."
docker network prune -f

# Step 7: Full system prune (optional)
print_status "Step 7: Full system cleanup..."
print_warning "This will remove ALL unused Docker objects (containers, networks, images, build cache)"
read -p "Continue with full system prune? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker system prune -af
    print_success "Full system cleanup completed"
else
    print_status "Skipping full system prune"
fi

# Step 8: Show space saved
print_status "Step 8: Docker usage after cleanup..."
docker system df

# Step 9: Restart services
print_status "Step 9: Restarting services..."
docker-compose up -d

# Step 10: Wait and check status
print_status "Step 10: Waiting for services to start..."
sleep 15

print_status "Container status:"
docker-compose ps

# Step 11: Test website
print_status "Step 11: Testing website accessibility..."
if curl -s -I https://veveve.dk | grep -q "200\|301\|302"; then
    print_success "Website is accessible after cleanup"
else
    print_warning "Website may need more time to start up"
fi

print_success "Docker cleanup completed!"
echo ""
echo "🔍 NEXT STEPS:"
echo "1. Check website: https://veveve.dk"
echo "2. Monitor logs: docker-compose logs --tail=20"
echo "3. If issues persist: ./diagnose-app-status.sh"
echo ""
echo "💾 SPACE SAVED:"
echo "Check the 'Docker usage after cleanup' section above to see space freed"

