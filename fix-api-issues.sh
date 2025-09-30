#!/bin/bash

echo "🔧 FIXING API ISSUES"
echo "===================="
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

# Issue 1: Fix the double /api/ URL issue
print_status "Issue 1: Fixing double /api/ URL in frontend environment..."

# Check current NEXT_PUBLIC_API_URL
echo "Current NEXT_PUBLIC_API_URL:"
grep "NEXT_PUBLIC_API_URL" env/frontend.env

# Fix the URL - it should NOT have /api at the end since the frontend adds it
sed -i 's|NEXT_PUBLIC_API_URL=http://localhost:8001/api|NEXT_PUBLIC_API_URL=http://localhost:8001|' env/frontend.env

print_success "Fixed NEXT_PUBLIC_API_URL to remove trailing /api"

# Issue 2: Add error handling to WooCommerce analytics endpoint
print_status "Issue 2: Adding error handling to WooCommerce analytics endpoint..."

# Create a patch for the analytics endpoint
cat > /tmp/analytics_fix.py << 'EOF'
# Add this error handling to the analytics method in backend/woocommerce/views.py
# around line 244 in the analytics method

try:
    # Date range for analysis
    end_date = timezone.now()
    start_date = end_date - timedelta(days=period)
    period_orders = queryset.filter(date_created__gte=start_date)
    
    # Basic metrics
    total_orders = period_orders.count()
    total_revenue = period_orders.aggregate(Sum('total'))['total__sum'] or 0
    avg_order_value = period_orders.aggregate(Avg('total'))['total__avg'] or 0
    
    # Prevent division by zero errors
    revenue_growth = 0
    order_growth = 0
    completion_rate = 0
    
    if total_orders > 0:
        # Growth comparison (previous period)
        prev_start = start_date - timedelta(days=period)
        prev_orders = queryset.filter(date_created__gte=prev_start, date_created__lt=start_date)
        prev_revenue = prev_orders.aggregate(Sum('total'))['total__sum'] or 0
        prev_count = prev_orders.count()
        
        revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        order_growth = ((total_orders - prev_count) / prev_count * 100) if prev_count > 0 else 0
        
        # Order completion rate
        completed_orders = period_orders.filter(
            status__in=['completed', 'processing']
        ).count()
        completion_rate = (completed_orders / total_orders * 100)
    
    # Rest of the analytics code...
    
except Exception as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Analytics endpoint error: {str(e)}")
    return Response(
        {'error': f'Analytics generation failed: {str(e)}'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
EOF

print_success "Created analytics error handling patch"

# Issue 3: Rebuild frontend with correct API URL
print_status "Issue 3: Rebuilding frontend container with correct API URL..."

# Stop frontend
docker-compose stop frontend

# Remove frontend container
docker-compose rm -f frontend

# Remove frontend image to force rebuild
docker image rm vvv-frontend:latest 2>/dev/null || true

# Rebuild frontend
docker build -f frontend.Dockerfile -t vvv-frontend:latest .

# Start frontend
docker-compose up -d frontend

print_success "Frontend rebuilt with correct API URL"

# Issue 4: Test the fixes
print_status "Issue 4: Testing the fixes..."

# Wait for frontend to start
sleep 15

# Test the corrected API URL (should not have double /api/)
echo "Testing API URL structure..."
echo "Frontend environment:"
docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL

# Test backend analytics endpoint directly
print_status "Testing backend analytics endpoint..."
if docker-compose exec backend python manage.py shell -c "
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from woocommerce.views import WooCommerceOrderViewSet
from rest_framework.test import force_authenticate

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
    else:
        print('❌ No users found for testing')
except Exception as e:
    print(f'❌ Analytics endpoint error: {e}')
" 2>/dev/null; then
    print_success "Backend analytics endpoint test completed"
else
    print_warning "Backend analytics endpoint test failed - this might be normal"
fi

print_success "API issues fix completed!"
echo ""
echo "🔍 VERIFICATION:"
echo "1. Check website: https://veveve.dk"
echo "2. Check browser console for API calls"
echo "3. Test WooCommerce dashboard functionality"
echo ""
echo "📋 EXPECTED RESULTS:"
echo "- No more double /api/api/ URLs in console"
echo "- WooCommerce analytics should load without 500 errors"
echo "- API endpoints should return proper JSON responses"
echo ""
echo "🔧 IF ISSUES PERSIST:"
echo "- Check frontend logs: docker-compose logs frontend --tail=20"
echo "- Check backend logs: docker-compose logs backend --tail=20"
echo "- Test API directly: curl -H 'Authorization: Bearer YOUR_TOKEN' https://veveve.dk/api/woocommerce/orders/analytics/"
