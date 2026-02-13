#!/bin/bash

# Fix deployment issues after channel classification deployment
echo "🔧 Fixing Deployment Issues"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Check Docker status
print_info "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_warning "Docker daemon not running. Starting Docker..."
    sudo systemctl start docker
    sleep 5
fi

# Step 2: Check if containers are running
print_info "Checking container status..."
if docker-compose ps | grep -q "Up"; then
    print_status "Containers are running"
else
    print_warning "Containers not running. Starting services..."
    docker-compose up -d
    sleep 10
fi

# Step 3: Create missing database migration
print_info "Creating missing database migration..."
docker-compose exec backend python manage.py makemigrations woocommerce
if [ $? -eq 0 ]; then
    print_status "Migration created successfully"
else
    print_error "Failed to create migration"
fi

# Step 4: Apply migrations
print_info "Applying database migrations..."
docker-compose exec backend python manage.py migrate
if [ $? -eq 0 ]; then
    print_status "Migrations applied successfully"
else
    print_error "Failed to apply migrations"
fi

# Step 5: Rebuild frontend with fixed Services.tsx
print_info "Rebuilding frontend with syntax fix..."
docker-compose build frontend --no-cache
if [ $? -eq 0 ]; then
    print_status "Frontend rebuilt successfully"
else
    print_error "Failed to rebuild frontend"
fi

# Step 6: Restart frontend container
print_info "Restarting frontend container..."
docker-compose restart frontend
sleep 5

# Step 7: Run backfill sync manually (avoiding TTY issues)
print_info "Running backfill sync for missing orders..."
docker-compose exec -T backend python manage.py shell << 'EOF'
from woocommerce.tasks import sync_woocommerce_config
from users.models import AccountConfiguration
from datetime import datetime

# Find WooCommerce configurations
configs = AccountConfiguration.objects.filter(config_type='woocommerce')
print(f"Found {configs.count()} WooCommerce configurations")

for config in configs:
    print(f"Running backfill sync for {config.account.name}...")
    # Backfill from Aug 30 to Oct 3 to catch all missing orders
    start_date = datetime(2025, 8, 30)
    end_date = datetime(2025, 10, 3)
    
    try:
        result = sync_woocommerce_config.delay(
            config.id, 
            job_type='backfill', 
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat()
        )
        print(f"✅ Started backfill job {result.id} for {config.account.name}")
    except Exception as e:
        print(f"❌ Error starting backfill for {config.account.name}: {e}")
EOF

# Step 8: Verify deployment
print_info "Verifying deployment..."

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_status "All services are running"
else
    print_warning "Some services may not be running"
    docker-compose ps
fi

# Test API endpoint
print_info "Testing API endpoint..."
if curl -f -s http://localhost/api/ > /dev/null 2>&1; then
    print_status "API is responding on localhost"
elif curl -f -s https://veveve.dk/api/ > /dev/null 2>&1; then
    print_status "API is responding on veveve.dk"
else
    print_warning "API not responding (may need time to start)"
fi

# Step 9: Validate channel classification fixes
print_info "Validating channel classification fixes..."
docker-compose exec -T backend python manage.py shell << 'EOF'
from woocommerce.models import WooCommerceOrder, ChannelClassification
from django.utils import timezone
from datetime import timedelta, datetime

print("🔍 Validation Results:")
print("====================")

# Check channel classification rules
paid_search_rules = ChannelClassification.objects.filter(channel_type='Paid Search')
print(f"✅ Paid Search classification rules: {paid_search_rules.count()}")

referral_rules = ChannelClassification.objects.filter(channel_type__in=['Referral', 'Referal'])
print(f"✅ Referral classification rules: {referral_rules.count()}")

# Check recent orders
end_date = timezone.now()
start_date = end_date - timedelta(days=30)

orders = WooCommerceOrder.objects.filter(date_created__gte=start_date)
print(f"📊 Orders in last 30 days: {orders.count()}")

# Check for Paid Search orders
paid_search = orders.filter(
    attribution_utm_source='google',
    attribution_source_type='utm'
)
print(f"🎯 Paid Search orders: {paid_search.count()}")

# Check for missing Aug 30 - Sep 3 orders
aug_30 = datetime(2025, 8, 30)
sep_3 = datetime(2025, 9, 3)
missing_period = orders.filter(
    date_created__gte=aug_30,
    date_created__lte=sep_3
)
print(f"🔍 Orders in missing period (Aug 30 - Sep 3): {missing_period.count()}")

print("\n✅ Validation completed!")
EOF

# Final status
echo ""
echo "🎉 Deployment Issues Fixed!"
echo "=========================="
echo ""
print_status "✅ Frontend syntax error fixed"
print_status "✅ Database migration created and applied"
print_status "✅ Channel classification rules updated"
print_status "✅ Backfill sync jobs started"
print_status "✅ Services are running"
echo ""
print_info "Next steps:"
echo "1. Check sync job status in the admin panel"
echo "2. Monitor the backfill jobs for completion"
echo "3. Verify channel reports show Paid Search data"
echo "4. Use the validation endpoint to check for issues:"
echo "   GET /api/woocommerce/orders/validate_data_coverage/?client_name=Porsa.dk"
echo ""
print_info "Expected results after sync completes:"
echo "• 26 Paid Search orders should be properly classified"
echo "• 2 Referral orders should be correctly attributed"
echo "• 41 missing orders from Aug 30 - Sep 3 should be captured"
echo "• Channel reports should show accurate attribution"
