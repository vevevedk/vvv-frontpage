#!/bin/bash

echo "🔧 COMPREHENSIVE VVV-FRONTPAGE FIX"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Step 1: Fix Database Password Mismatch
print_status "Step 1: Fixing database password mismatch..."

# Update backend.env with the correct password from docker-compose.yml
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=Yo6g\/LhuoAvQHd24QwhhmiQ5q7TGPc1HfA7Y7RB3gUE=/' env/backend.env

print_success "Updated backend.env with correct database password"

# Step 2: Fix ALLOWED_HOSTS for Docker internal communication
print_status "Step 2: Ensuring ALLOWED_HOSTS includes 'backend'..."

# Check if 'backend' is already in ALLOWED_HOSTS
if ! grep -q "backend" env/backend.env; then
    sed -i 's/ALLOWED_HOSTS=.*/ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk/' env/backend.env
    print_success "Added 'backend' to ALLOWED_HOSTS"
else
    print_success "ALLOWED_HOSTS already includes 'backend'"
fi

# Step 3: Fix Django SSL Redirect for Internal Communication
print_status "Step 3: Creating development-compatible Django settings for internal communication..."

# Create a new settings file for Docker internal communication
cat > backend/api/settings/docker.py << 'EOF'
from .base import *
from decouple import config

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = [h.strip() for h in config('ALLOWED_HOSTS', default='').split(',') if h.strip()]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT'),
    }
}

# DISABLE SSL redirects for internal Docker communication
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Security settings (keep others for production safety)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Trust X-Forwarded-Proto from reverse proxy (e.g., Nginx)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Honor X-Forwarded-Host if present
USE_X_FORWARDED_HOST = True

# CSRF trusted origins (explicit or derived from ALLOWED_HOSTS)
_raw_csrf = config('CSRF_TRUSTED_ORIGINS', default='')
if _raw_csrf:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in _raw_csrf.split(',') if o.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [f"https://{host}" for host in ALLOWED_HOSTS]

# CORS in production (if provided)
_raw_cors = config('CORS_ALLOWED_ORIGINS', default='')
if _raw_cors:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _raw_cors.split(',') if o.strip()]

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST')
EMAIL_PORT = config('EMAIL_PORT')
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
EMAIL_USE_TLS = True
EOF

print_success "Created docker.py settings file with SSL redirects disabled"

# Step 4: Update docker-compose.yml to use Docker settings
print_status "Step 4: Updating docker-compose.yml to use Docker-specific settings..."

# Update backend service to use docker settings
sed -i 's/DJANGO_SETTINGS_MODULE=api.settings.prod/DJANGO_SETTINGS_MODULE=api.settings.docker/' docker-compose.yml

print_success "Updated docker-compose.yml to use docker settings"

# Step 5: Fix Frontend Environment Variables
print_status "Step 5: Ensuring frontend environment variables are correct..."

# Ensure frontend.env has correct values
if ! grep -q "DJANGO_API_URL=http://backend:8000/api" env/frontend.env; then
    sed -i 's|DJANGO_API_URL=.*|DJANGO_API_URL=http://backend:8000/api|' env/frontend.env
    print_success "Updated DJANGO_API_URL in frontend.env"
else
    print_success "DJANGO_API_URL already correct in frontend.env"
fi

# Step 6: Clean Docker Environment
print_status "Step 6: Cleaning Docker environment..."

# Stop all containers
docker-compose down

# Remove old containers and networks
docker-compose rm -f

# Remove old images to force rebuild
docker image rm vvv-frontend:latest vvv-backend:latest 2>/dev/null || true

print_success "Cleaned Docker environment"

# Step 7: Rebuild and Start Services
print_status "Step 7: Rebuilding and starting services..."

# Build new images
docker build -f frontend.Dockerfile -t vvv-frontend:latest .
docker build -f backend/Dockerfile -t vvv-backend:latest .

# Start services
docker-compose up -d

print_success "Services started"

# Step 8: Wait for Services and Test
print_status "Step 8: Waiting for services to start and testing..."

# Wait for services to be ready
sleep 30

# Test database connection
print_status "Testing database connection..."
if docker-compose exec backend python manage.py shell -c "from django.db import connection; connection.ensure_connection(); print('Database connection successful')" 2>/dev/null; then
    print_success "Database connection successful"
else
    print_error "Database connection failed"
fi

# Run migrations
print_status "Running database migrations..."
docker-compose exec backend python manage.py migrate

# Test backend connectivity
print_status "Testing backend connectivity..."
if docker-compose exec frontend wget -qO- http://backend:8000/api/test/ 2>/dev/null; then
    print_success "Backend connectivity successful"
else
    print_warning "Backend connectivity test failed - this might be normal if /api/test/ doesn't exist"
fi

# Test login endpoint
print_status "Testing login endpoint..."
if docker-compose exec frontend wget -qO- --post-data='{"email": "andreas@veveve.dk", "password": "avxzVvv2k25!!"}' --header="Content-Type: application/json" http://backend:8000/api/auth/login/ 2>/dev/null | grep -q "access_token"; then
    print_success "Login endpoint working"
else
    print_warning "Login endpoint test failed - check if user exists"
fi

print_success "Comprehensive fix completed!"
echo ""
echo "🔍 NEXT STEPS:"
echo "1. Test the login functionality in your browser"
echo "2. Check backend logs: docker-compose logs backend --tail=20"
echo "3. Check frontend logs: docker-compose logs frontend --tail=20"
echo ""
echo "📋 TROUBLESHOOTING:"
echo "If issues persist:"
echo "- docker-compose logs backend --tail=50"
echo "- docker-compose logs frontend --tail=50"
echo "- Check if user exists: docker-compose exec backend python manage.py shell -c \"from users.models import User; print(User.objects.count())\""
