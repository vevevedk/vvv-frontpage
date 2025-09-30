#!/bin/bash

echo "🚀 DEPLOYING COMPREHENSIVE FIX TO PRODUCTION"
echo "============================================="
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
print_status "Step 1: Pulling latest changes from git..."
git pull origin main

if [ $? -eq 0 ]; then
    print_success "Git pull successful"
else
    print_error "Git pull failed"
    exit 1
fi

# Step 2: Make comprehensive fix script executable
print_status "Step 2: Making comprehensive fix script executable..."
chmod +x comprehensive-fix.sh

# Step 3: Run the comprehensive fix
print_status "Step 3: Running comprehensive fix..."
./comprehensive-fix.sh

if [ $? -eq 0 ]; then
    print_success "Comprehensive fix completed successfully"
else
    print_error "Comprehensive fix failed"
    exit 1
fi

# Step 4: Restart system services
print_status "Step 4: Restarting system services..."

# Restart Nginx
sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    print_success "Nginx reloaded successfully"
else
    print_warning "Nginx reload failed - may need manual restart"
fi

# Step 5: Final verification
print_status "Step 5: Running final verification..."

# Test website accessibility
print_status "Testing website accessibility..."
if curl -s -o /dev/null -w "%{http_code}" https://veveve.dk | grep -q "200"; then
    print_success "Website is accessible"
else
    print_warning "Website accessibility test failed"
fi

# Test API endpoint
print_status "Testing API endpoint..."
if curl -s -o /dev/null -w "%{http_code}" https://veveve.dk/api/test/ | grep -q "200\|404"; then
    print_success "API endpoint is responding"
else
    print_warning "API endpoint test failed"
fi

print_success "Production deployment completed!"
echo ""
echo "🔍 NEXT STEPS:"
echo "1. Test login functionality in your browser at https://veveve.dk/login"
echo "2. Check logs if issues persist:"
echo "   - docker-compose logs backend --tail=20"
echo "   - docker-compose logs frontend --tail=20"
echo ""
echo "📋 MONITORING COMMANDS:"
echo "- Check container status: docker-compose ps"
echo "- Check backend logs: docker-compose logs backend --tail=50"
echo "- Check frontend logs: docker-compose logs frontend --tail=50"
echo "- Test database: docker-compose exec backend python manage.py shell -c \"from django.db import connection; connection.ensure_connection(); print('✅ Database OK')\""
echo ""
echo "🆘 IF ISSUES PERSIST:"
echo "- Check the COMPREHENSIVE_FIX_ANALYSIS.md file for troubleshooting steps"
echo "- Verify environment variables: docker-compose exec backend env | grep -E '(ALLOWED_HOSTS|DB_PASSWORD|DJANGO_SETTINGS)'"
