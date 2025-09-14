#!/bin/bash

# Production Deployment Script for VEVEVE
echo "🚀 Starting VEVEVE Production Deployment"
echo "========================================"

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

# Step 1: Stop existing containers
print_status "Stopping existing containers..."
docker-compose down

# Step 2: Build images
print_status "Building Docker images..."

# Build frontend
print_status "Building frontend image..."
docker build -f frontend.Dockerfile -t vvv-frontend:latest . || {
    print_error "Failed to build frontend image"
    exit 1
}

# Build backend (if Dockerfile exists)
if [ -f "backend/Dockerfile" ]; then
    print_status "Building backend image..."
    docker build -f backend/Dockerfile -t vvv-backend:latest ./backend || {
        print_error "Failed to build backend image"
        exit 1
    }
else
    print_warning "Backend Dockerfile not found, using existing image"
fi

# Step 3: Start services
print_status "Starting services with docker-compose..."
docker-compose up -d

# Step 4: Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Step 5: Check service status
print_status "Checking service status..."
docker-compose ps

# Step 6: Test the application
print_status "Testing application..."
if curl -f -s http://localhost > /dev/null; then
    print_status "Application is responding on localhost"
else
    print_warning "Application not responding on localhost"
fi

if curl -f -s http://veveve.dk > /dev/null; then
    print_status "Application is responding on veveve.dk"
else
    print_warning "Application not responding on veveve.dk"
fi

# Step 7: Show logs
print_status "Showing recent logs..."
docker-compose logs --tail=20

echo ""
echo "🎉 Deployment completed!"
echo "========================="
echo "Your application should be available at:"
echo "  - http://veveve.dk"
echo "  - http://209.38.98.109"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
echo "To restart: docker-compose restart"
