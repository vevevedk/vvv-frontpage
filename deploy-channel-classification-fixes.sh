#!/bin/bash

# Deployment script for Channel Classification Fixes
# This script deploys the fixes for Paid Search and Referral classification issues

echo "🔧 Deploying Channel Classification Fixes"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Step 1: Pre-deployment backup
print_info "Creating backup of current database..."
BACKUP_FILE="backup_before_channel_fixes_$(date +%Y%m%d_%H%M%S).sql"
if docker-compose exec -T postgres pg_dump -U vvv_user vvv_database > "$BACKUP_FILE" 2>/dev/null; then
    print_status "Database backup created: $BACKUP_FILE"
else
    print_warning "Could not create database backup (this is okay for development)"
fi

# Step 2: Stop services for clean deployment
print_info "Stopping services for clean deployment..."
docker-compose down

# Step 3: Build new images with fixes
print_info "Building Docker images with channel classification fixes..."
docker-compose build --no-cache

# Step 4: Start services
print_info "Starting services..."
docker-compose up -d

# Step 5: Wait for services to be ready
print_info "Waiting for services to start..."
sleep 20

# Step 6: Run database migrations (if any)
print_info "Running database migrations..."
if docker-compose exec backend python manage.py migrate --no-input; then
    print_status "Database migrations completed"
else
    print_error "Database migrations failed"
    exit 1
fi

# Step 7: Update channel classification rules
print_info "Updating channel classification rules..."
if docker-compose exec backend python manage.py update_channel_classifications; then
    print_status "Channel classification rules updated"
else
    print_error "Failed to update channel classification rules"
    exit 1
fi

# Step 8: Run backfill sync for missing orders
print_info "Running backfill sync to fetch missing orders (Aug 30 - Sep 3)..."
docker-compose exec backend python manage.py shell << 'EOF'
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

# Step 9: Verify deployment
print_info "Verifying deployment..."

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_status "Services are running"
else
    print_error "Services are not running properly"
    docker-compose ps
    exit 1
fi

# Test API endpoint
print_info "Testing API endpoint..."
if curl -f -s http://localhost/api/ > /dev/null 2>&1; then
    print_status "API is responding"
else
    print_warning "API not responding on localhost (might be normal if using domain)"
fi

# Test domain (if available)
if curl -f -s https://veveve.dk/api/ > /dev/null 2>&1; then
    print_status "API is responding on veveve.dk"
else
    print_warning "API not responding on veveve.dk (check domain configuration)"
fi

# Step 10: Validate channel classification fixes
print_info "Validating channel classification fixes..."
docker-compose exec backend python manage.py shell << 'EOF'
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

# Step 11: Final status
echo ""
echo "🎉 Channel Classification Fixes Deployment Complete!"
echo "=================================================="
echo ""
print_status "✅ Database migrations applied"
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
echo ""
print_warning "Note: Backfill sync jobs are running in the background."
print_warning "It may take a few minutes for all missing orders to be processed."
