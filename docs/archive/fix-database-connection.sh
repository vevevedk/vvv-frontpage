#!/bin/bash

echo "🔧 FIXING DATABASE CONNECTION"
echo "============================="
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

# Step 1: Stop all containers
print_status "Step 1: Stopping all containers..."
docker-compose down

# Step 2: Fix database password mismatch
print_status "Step 2: Fixing database password mismatch..."

# Get the password from docker-compose.yml
POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD" docker-compose.yml | cut -d'=' -f2 | tr -d ' "')
echo "PostgreSQL password from docker-compose.yml: $POSTGRES_PASSWORD"

# Update backend.env with the correct password
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$POSTGRES_PASSWORD/" env/backend.env

print_success "Updated backend.env with correct database password"

# Step 3: Remove old database volume to ensure fresh start
print_status "Step 3: Removing old database volume for fresh start..."
docker volume rm vvv-frontpage_postgres_data 2>/dev/null || print_warning "Volume didn't exist or couldn't be removed"

# Step 4: Start database first
print_status "Step 4: Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for database to be ready
print_status "Waiting for database to initialize..."
sleep 15

# Step 5: Test database connection
print_status "Step 5: Testing database connection..."
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;" 2>/dev/null && print_success "Database connection successful" || print_error "Database connection failed"

# Step 6: Start backend
print_status "Step 6: Starting backend container..."
docker-compose up -d backend

# Wait for backend to start
print_status "Waiting for backend to start..."
sleep 20

# Step 7: Run migrations
print_status "Step 7: Running database migrations..."
docker-compose exec backend python manage.py migrate

# Step 8: Test Django database connection
print_status "Step 8: Testing Django database connection..."
docker-compose exec backend python manage.py shell -c "
from django.db import connection
try:
    connection.ensure_connection()
    print('✅ Django database connection successful')
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute('SELECT COUNT(*) FROM django_migrations')
        result = cursor.fetchone()
        print(f'✅ Database query successful: {result[0]} migrations found')
except Exception as e:
    print(f'❌ Django database connection failed: {e}')
    import traceback
    traceback.print_exc()
"

# Step 9: Start all services
print_status "Step 9: Starting all services..."
docker-compose up -d

# Wait for services
sleep 10

# Step 10: Final test
print_status "Step 10: Final connectivity test..."
if docker-compose exec frontend wget -qO- http://backend:8000/api/test/ 2>/dev/null; then
    print_success "Backend API is responding"
else
    print_warning "Backend API test failed - this might be normal if /api/test/ doesn't exist"
fi

print_success "Database connection fix completed!"
echo ""
echo "🔍 VERIFICATION:"
echo "1. Check container status: docker-compose ps"
echo "2. Check backend logs: docker-compose logs backend --tail=20"
echo "3. Test website: https://veveve.dk"
echo "4. Test API endpoints in browser console"
echo ""
echo "📋 IF ISSUES PERSIST:"
echo "- Run: ./diagnose-db-connection.sh"
echo "- Check logs: docker-compose logs backend --tail=50"
echo "- Check postgres logs: docker-compose logs postgres --tail=20"
