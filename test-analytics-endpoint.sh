#!/bin/bash

echo "🔍 TESTING WOOCOMMERCE ANALYTICS ENDPOINT"
echo "=========================================="
echo ""

# Test the analytics endpoint directly from backend
echo "Testing analytics endpoint from backend container..."
docker-compose exec backend python manage.py shell -c "
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from woocommerce.views import WooCommerceOrderViewSet
from rest_framework.test import force_authenticate
import traceback

try:
    User = get_user_model()
    user = User.objects.first()
    if user:
        print(f'✅ Found user: {user.email}')
        
        factory = RequestFactory()
        request = factory.get('/api/woocommerce/orders/analytics/')
        request.user = user
        
        viewset = WooCommerceOrderViewSet()
        viewset.request = request
        
        # Test the analytics method
        response = viewset.analytics(request)
        print(f'✅ Analytics endpoint test: Status {response.status_code}')
        if hasattr(response, 'data') and response.data:
            print(f'✅ Response data keys: {list(response.data.keys())}')
        else:
            print('❌ No response data')
    else:
        print('❌ No users found for testing')
        print('Available users:')
        for u in User.objects.all():
            print(f'  - {u.email}')
except Exception as e:
    print(f'❌ Analytics endpoint error: {e}')
    print('Full traceback:')
    traceback.print_exc()
"

echo ""
echo "Testing with a simple Django shell command..."
docker-compose exec backend python manage.py shell -c "
from woocommerce.models import WooCommerceOrder
print(f'Total WooCommerce orders: {WooCommerceOrder.objects.count()}')
if WooCommerceOrder.objects.exists():
    order = WooCommerceOrder.objects.first()
    print(f'First order fields: {[f.name for f in order._meta.fields]}')
    print(f'First order billing_email: {getattr(order, \"billing_email\", \"NOT_FOUND\")}')
else:
    print('No WooCommerce orders found')
"

echo ""
echo "Checking recent backend logs for any errors..."
docker-compose logs backend --tail=30
