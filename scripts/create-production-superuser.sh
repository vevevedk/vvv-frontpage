#!/bin/bash
# Create superuser on production
# Run: bash scripts/create-production-superuser.sh

cd /var/www/vvv-frontpage

echo "=== Creating superuser on production ==="

docker-compose exec -T backend python manage.py shell -c "
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
echo "Login at https://veveve.io/login with:"
echo "  Email: andreas@veveve.io"
echo "  Password: 7xII0rIe1IBnHy5nuMO/Jg=="
