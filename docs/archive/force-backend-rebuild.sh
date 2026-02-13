#!/bin/bash

echo "🔧 FORCING BACKEND REBUILD"
echo "=========================="
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

# Step 1: Pull latest changes
print_status "Step 1: Pulling latest changes..."
git pull origin main

# Step 2: Stop all containers
print_status "Step 2: Stopping all containers..."
docker-compose down

# Step 3: Remove backend container and image completely
print_status "Step 3: Removing backend container and image..."
docker-compose rm -f backend
docker image rm vvv-backend:latest 2>/dev/null || true

# Step 4: Force rebuild backend from scratch
print_status "Step 4: Building backend image from scratch..."
docker build -f backend/Dockerfile -t vvv-backend:latest .

if [ $? -eq 0 ]; then
    print_success "Backend image built successfully"
else
    print_error "Backend image build failed"
    exit 1
fi

# Step 5: Start backend only first
print_status "Step 5: Starting backend container..."
docker-compose up -d backend

# Step 6: Wait for backend to start
print_status "Step 6: Waiting for backend to initialize..."
sleep 15

# Step 7: Test backend syntax
print_status "Step 7: Testing backend syntax..."
if docker-compose exec backend python -c "import woocommerce.views; print('✅ Syntax OK')" 2>/dev/null; then
    print_success "Backend syntax is correct"
else
    print_error "Backend syntax error detected"
    docker-compose exec backend python -c "import woocommerce.views" 2>&1 | head -10
    exit 1
fi

# Step 8: Start all services
print_status "Step 8: Starting all services..."
docker-compose up -d

# Step 9: Final test
print_status "Step 9: Final API test..."
sleep 10

if curl -s -I https://veveve.dk/api/woocommerce/orders/analytics/ | grep -q "200\|404"; then
    print_success "API endpoint responding correctly"
else
    print_warning "API endpoint still having issues - check logs"
fi

print_success "Backend rebuild completed!"
echo ""
echo "🔍 VERIFICATION:"
echo "1. Check backend logs: docker-compose logs backend --tail=20"
echo "2. Test API: curl -I https://veveve.dk/api/woocommerce/orders/analytics/"
echo "3. Check website: https://veveve.dk"
