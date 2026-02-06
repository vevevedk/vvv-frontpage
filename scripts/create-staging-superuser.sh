#!/bin/bash
# Create superuser on staging
# Run: bash scripts/create-staging-superuser.sh

echo "=== Creating superuser on staging ==="

docker exec -w /app/backend staging_backend python manage.py shell -c "
from users.models import User
User.objects.filter(email='andreas@veveve.io').delete()
user = User.objects.create_user(
    email='andreas@veveve.io',
    username='andreas@veveve.io',
    password='7xII0rIe1IBnHy5nuMO/Jg==',
    role='super_admin',
    is_active=True,
    email_verified=True
)
print(f'Created superuser: {user.email} with role: {user.role}')
"

echo "=== Done ==="
echo "Login at https://staging.veveve.io/login with:"
echo "  Email: andreas@veveve.io"
echo "  Password: 7xII0rIe1IBnHy5nuMO/Jg=="
