#!/bin/bash

echo "👤 Creating test user..."

docker-compose exec backend python manage.py shell -c "
from users.models import User
from django.contrib.auth.hashers import make_password

# Check if user exists
try:
    user = User.objects.get(email='andreas@veveve.dk')
    print(f'✅ User already exists: {user.email}')
    print(f'   Email verified: {user.email_verified}')
    print(f'   Role: {user.role}')
except User.DoesNotExist:
    print('❌ User not found, creating...')
    
    # Create user
    user = User.objects.create(
        email='andreas@veveve.dk',
        username='andreas@veveve.dk',
        first_name='Andreas',
        last_name='Iversen',
        role='admin',
        email_verified=False,
        is_active=True,
        is_staff=True,
        is_superuser=True
    )
    
    # Set password
    user.set_password('avxzVvv2k25!!')
    user.save()
    
    print(f'✅ User created: {user.email}')
    print(f'   Email verified: {user.email_verified}')
    print(f'   Role: {user.role}')
    print(f'   Password: avxzVvv2k25!!')
"

echo "✅ User creation complete"
