#!/bin/bash

#############################################
# Test Health Check Endpoints
# Useful for verifying health endpoints work correctly
#############################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo "🏥 Testing Health Check Endpoints"
echo "=================================="
echo ""

# Test Frontend Health Endpoint
print_info "Testing Frontend Health Endpoint..."
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    response=$(curl -s http://localhost:3000/api/health)
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Check status
    status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$status" = "healthy" ]; then
        print_success "Frontend health check: $status"
    else
        print_warning "Frontend health check: $status"
    fi
else
    print_error "Frontend health endpoint not responding"
fi

echo ""

# Test Backend Health Endpoint
print_info "Testing Backend Health Endpoint..."
if curl -sf http://localhost:8001/api/health/ > /dev/null 2>&1; then
    response=$(curl -s http://localhost:8001/api/health/)
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Check status
    status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$status" = "healthy" ]; then
        print_success "Backend health check: $status"
    else
        print_warning "Backend health check: $status"
    fi
else
    print_warning "Backend health endpoint not responding (may need to be started)"
fi

echo ""

# Test Nginx Health Endpoint
print_info "Testing Nginx Health Endpoint (external)..."
if curl -sf https://veveve.dk/health > /dev/null 2>&1; then
    response=$(curl -s https://veveve.dk/health)
    print_success "Nginx health endpoint: $response"
else
    print_warning "Nginx health endpoint not accessible externally"
fi

echo ""
echo "✅ Health check tests completed"
echo ""







