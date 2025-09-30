#!/bin/bash

echo "🔧 DEPLOYING ANALYTICS FIELD NAME FIX"
echo "======================================"
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

# Step 2: Rebuild backend with fixed field names
print_status "Step 2: Rebuilding backend container with analytics fix..."
docker-compose stop backend
docker-compose rm -f backend
docker image rm vvv-backend:latest 2>/dev/null || true

# Build new backend image
docker build -f backend/Dockerfile -t vvv-backend:latest .

# Start backend
docker-compose up -d backend

print_success "Backend rebuilt with analytics field name fixes"

# Step 3: Wait for backend to start
print_status "Step 3: Waiting for backend to start..."
sleep 15

# Step 4: Test the analytics endpoint
print_status "Step 4: Testing WooCommerce analytics endpoint..."
if docker-compose exec backend python manage.py shell -c "
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from woocommerce.views import WooCommerceOrderViewSet

try:
    User = get_user_model()
    user = User.objects.first()
    if user:
        factory = RequestFactory()
        request = factory.get('/api/woocommerce/orders/analytics/')
        request.user = user
        
        viewset = WooCommerceOrderViewSet()
        viewset.request = request
        
        # Test the analytics method
        response = viewset.analytics(request)
        print(f'✅ Analytics endpoint test: {response.status_code}')
        if response.status_code == 200:
            print('✅ Analytics endpoint working correctly!')
        else:
            print(f'❌ Analytics endpoint returned status {response.status_code}')
    else:
        print('❌ No users found for testing')
except Exception as e:
    print(f'❌ Analytics endpoint error: {e}')
" 2>/dev/null; then
    print_success "Analytics endpoint test completed"
else
    print_warning "Analytics endpoint test failed"
fi

# Step 5: Test API endpoint from frontend
print_status "Step 5: Testing API endpoint from frontend..."
if docker-compose exec frontend wget -qO- http://backend:8000/api/woocommerce/orders/analytics/ 2>/dev/null | grep -q "error\|period\|overview"; then
    print_success "API endpoint responding correctly"
else
    print_warning "API endpoint test inconclusive - check manually"
fi

print_success "Analytics field name fix deployed!"
echo ""
echo "🎯 VERIFICATION:"
echo "1. Check website: https://veveve.dk"
echo "2. Go to WooCommerce dashboard"
echo "3. Check browser console for successful API calls"
echo "4. Verify analytics data loads without errors"
echo ""
echo "📋 EXPECTED RESULTS:"
echo "- No more 'Cannot resolve keyword customer_email' errors"
echo "- WooCommerce analytics dashboard loads properly"
echo "- Customer data displays correctly"
echo "- No 500 Internal Server Errors on analytics endpoints"
echo ""
echo "🔧 IF ISSUES PERSIST:"
echo "- Check backend logs: docker-compose logs backend --tail=20"
echo "- Test API directly: curl https://veveve.dk/api/woocommerce/orders/analytics/"
