#!/bin/bash

echo "🔍 DATABASE CONNECTION DIAGNOSTIC"
echo "================================="
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

# Step 1: Check if containers are running
print_status "Step 1: Checking container status..."
docker-compose ps

echo ""

# Step 2: Check database container
print_status "Step 2: Checking database container status..."
if docker-compose ps postgres | grep -q "Up"; then
    print_success "PostgreSQL container is running"
else
    print_error "PostgreSQL container is not running"
    echo "Starting PostgreSQL container..."
    docker-compose up -d postgres
    sleep 5
fi

# Step 3: Check backend container
print_status "Step 3: Checking backend container status..."
if docker-compose ps backend | grep -q "Up"; then
    print_success "Backend container is running"
else
    print_error "Backend container is not running"
    echo "Starting backend container..."
    docker-compose up -d backend
    sleep 10
fi

# Step 4: Check environment variables
print_status "Step 4: Checking database environment variables..."
echo "Backend environment variables:"
docker-compose exec backend env | grep -E "(DB_|POSTGRES_)" || print_warning "Could not check backend environment"

echo ""
echo "PostgreSQL environment variables:"
docker-compose exec postgres env | grep -E "(POSTGRES_)" || print_warning "Could not check postgres environment"

# Step 5: Test database connection
print_status "Step 5: Testing database connection from backend..."
echo "Attempting Django database connection test..."

# Try to test database connection
if docker-compose exec backend python manage.py shell -c "
from django.db import connection
try:
    connection.ensure_connection()
    print('✅ Database connection successful')
    # Test a simple query
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
        result = cursor.fetchone()
        print(f'✅ Database query successful: {result}')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    import traceback
    traceback.print_exc()
" 2>/dev/null; then
    print_success "Database connection test completed"
else
    print_error "Database connection test failed"
fi

# Step 6: Check database credentials mismatch
print_status "Step 6: Checking for credential mismatches..."

# Check backend.env
echo "Backend environment file (backend.env):"
if [ -f "env/backend.env" ]; then
    grep "DB_PASSWORD" env/backend.env || echo "DB_PASSWORD not found in backend.env"
else
    print_error "env/backend.env file not found"
fi

# Check docker-compose.yml
echo "Docker-compose.yml PostgreSQL password:"
grep "POSTGRES_PASSWORD" docker-compose.yml || echo "POSTGRES_PASSWORD not found in docker-compose.yml"

# Step 7: Check recent backend logs
print_status "Step 7: Checking recent backend logs for database errors..."
echo "Last 20 lines of backend logs:"
docker-compose logs backend --tail=20

# Step 8: Check if database exists and is accessible
print_status "Step 8: Checking database accessibility..."
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;" 2>/dev/null && print_success "Database is accessible" || print_error "Database is not accessible"

# Step 9: Check database user and permissions
print_status "Step 9: Checking database user and permissions..."
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT current_user, current_database();" 2>/dev/null || print_error "Cannot connect with vvv_user"

echo ""
echo "🔧 QUICK FIXES TO TRY:"
echo "1. If database password mismatch: ./comprehensive-fix.sh"
echo "2. If containers not running: docker-compose up -d"
echo "3. If database corrupted: docker-compose down && docker volume rm vvv-frontpage_postgres_data && docker-compose up -d"
echo ""
echo "📋 NEXT STEPS:"
echo "- Run: docker-compose logs backend --tail=50"
echo "- Run: docker-compose logs postgres --tail=20"
echo "- Test API: curl -I https://veveve.dk/api/test/"
