#!/bin/bash

echo "🔍 Testing Backend Connection..."

# Test 1: Backend health check
echo "1. Testing backend health..."
curl -s http://localhost:8001/api/test/ && echo "" || echo "❌ Backend not responding"

# Test 2: Check if user exists
echo "2. Checking if user exists in database..."
docker-compose exec backend python manage.py shell -c "
from users.models import User
try:
    user = User.objects.get(email='andreas@veveve.dk')
    print(f'✅ User found: {user.email}, email_verified: {user.email_verified}')
except User.DoesNotExist:
    print('❌ User andreas@veveve.dk not found in database')
except Exception as e:
    print(f'❌ Database error: {e}')
"

# Test 3: Test login directly
echo "3. Testing login directly..."
curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "andreas@veveve.dk", "password": "avxzVvv2k25!!"}' \
  -s | jq . || echo "❌ Login failed"

echo "✅ Backend connection test complete"
