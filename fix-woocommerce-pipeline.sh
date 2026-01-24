#!/bin/bash

#############################################
# WooCommerce Pipeline Diagnostic & Fix Script
# For Production Server: veveve.dk
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Check if we're in the right directory
check_environment() {
    print_header "Checking Environment"
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "Not in the correct directory. Please run from /opt/vvv-frontpage"
        exit 1
    fi
    
    print_success "Environment check passed"
}

# Check Docker containers status
check_containers() {
    print_header "Checking Container Status"
    
    print_info "Current container status:"
    docker-compose ps
    
    # Check if all required services are running
    local services=("postgres" "redis" "backend" "worker" "beat" "frontend")
    local all_running=true
    
    for service in "${services[@]}"; do
        if ! docker-compose ps --services --filter "status=running" | grep -q "^${service}$"; then
            print_error "Service $service is not running"
            all_running=false
        else
            print_success "Service $service is running"
        fi
    done
    
    if [ "$all_running" = false ]; then
        print_warning "Some services are not running. Attempting to start them..."
        docker-compose up -d
        sleep 10
    fi
}

# Check WooCommerce configurations
check_woocommerce_configs() {
    print_header "Checking WooCommerce Configurations"
    
    print_info "Running WooCommerce configuration check..."
    docker-compose exec -T backend python manage.py shell << 'EOF'
from users.models import AccountConfiguration
from woocommerce.tasks import test_woocommerce_connection

configs = AccountConfiguration.objects.filter(config_type='woocommerce')
print(f"Found {configs.count()} WooCommerce configurations:")

for config in configs:
    print(f"\n--- {config.account.name} ({config.name}) ---")
    woocommerce_config = config.get_woocommerce_config()
    if woocommerce_config:
        print(f"Store URL: {woocommerce_config.get('store_url', 'Not set')}")
        print(f"Consumer Key: {'Set' if woocommerce_config.get('consumer_key') else 'Not set'}")
        print(f"Consumer Secret: {'Set' if woocommerce_config.get('consumer_secret') else 'Not set'}")
        
        # Test connection
        success, message = test_woocommerce_connection(woocommerce_config)
        if success:
            print(f"✅ Connection: {message}")
        else:
            print(f"❌ Connection: {message}")
    else:
        print("❌ Invalid WooCommerce configuration")
EOF
}

# Check recent pipeline logs
check_pipeline_logs() {
    print_header "Checking Pipeline Logs"
    
    print_info "Recent WooCommerce sync logs:"
    docker-compose exec -T backend python manage.py shell << 'EOF'
from woocommerce.models import WooCommerceSyncLog, WooCommerceJob
from django.utils import timezone
from datetime import timedelta

# Check recent logs
recent_logs = WooCommerceSyncLog.objects.filter(
    created_at__gte=timezone.now() - timedelta(days=7)
).order_by('-created_at')[:10]

print(f"Recent logs (last 7 days): {recent_logs.count()}")
for log in recent_logs:
    print(f"  {log.created_at}: {log.level} - {log.message[:100]}")

# Check recent jobs
recent_jobs = WooCommerceJob.objects.filter(
    created_at__gte=timezone.now() - timedelta(days=7)
).order_by('-created_at')[:5]

print(f"\nRecent jobs (last 7 days): {recent_jobs.count()}")
for job in recent_jobs:
    print(f"  {job.created_at}: {job.job_type} - {job.status}")
    if job.error_message:
        print(f"    Error: {job.error_message[:100]}")
EOF
}

# Check database connectivity and data
check_database() {
    print_header "Checking Database Status"
    
    print_info "Testing database connection..."
    docker-compose exec -T backend python manage.py shell << 'EOF'
from django.db import connection
from woocommerce.models import WooCommerceOrder, WooCommerceJob, WooCommerceSyncLog

# Test database connection
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    exit(1)

# Check data counts
orders_count = WooCommerceOrder.objects.count()
jobs_count = WooCommerceJob.objects.count()
logs_count = WooCommerceSyncLog.objects.count()

print(f"📊 Data counts:")
print(f"  Orders: {orders_count}")
print(f"  Jobs: {jobs_count}")
print(f"  Logs: {logs_count}")

if orders_count > 0:
    latest_order = WooCommerceOrder.objects.order_by('-date_created').first()
    print(f"  Latest order: {latest_order.date_created} ({latest_order.client_name})")
EOF
}

# Test WooCommerce API connections
test_woocommerce_apis() {
    print_header "Testing WooCommerce API Connections"
    
    print_info "Testing all WooCommerce API connections..."
    docker-compose exec -T backend python manage.py shell << 'EOF'
from users.models import AccountConfiguration
from woocommerce.tasks import test_woocommerce_connection
import requests

configs = AccountConfiguration.objects.filter(config_type='woocommerce')
print(f"Testing {configs.count()} WooCommerce configurations...")

for config in configs:
    print(f"\n--- Testing {config.account.name} ---")
    woocommerce_config = config.get_woocommerce_config()
    
    if not woocommerce_config:
        print("❌ No WooCommerce configuration found")
        continue
    
    # Test connection
    success, message = test_woocommerce_connection(woocommerce_config)
    print(f"Connection test: {'✅' if success else '❌'} {message}")
    
    if success:
        # Try to fetch a few orders
        try:
            store_url = woocommerce_config['store_url'].rstrip('/')
            api_url = f"{store_url}/wp-json/wc/v3/orders"
            
            response = requests.get(
                api_url,
                auth=(woocommerce_config['consumer_key'], woocommerce_config['consumer_secret']),
                params={'per_page': 1, 'status': 'any'},
                timeout=10
            )
            
            if response.status_code == 200:
                orders = response.json()
                print(f"✅ API test successful - found {len(orders)} orders (sample)")
            else:
                print(f"❌ API test failed - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ API test failed - Error: {str(e)}")
EOF
}

# Run a manual sync to test the pipeline
test_manual_sync() {
    print_header "Testing Manual Sync"
    
    print_info "Running manual WooCommerce sync for testing..."
    docker-compose exec -T backend python manage.py shell << 'EOF'
from users.models import AccountConfiguration
from woocommerce.tasks import sync_woocommerce_config
from django.utils import timezone
from datetime import timedelta

configs = AccountConfiguration.objects.filter(config_type='woocommerce', is_active=True)
print(f"Found {configs.count()} active WooCommerce configurations")

for config in configs:
    print(f"\n--- Testing sync for {config.account.name} ---")
    try:
        # Run sync for last 7 days
        start_date = timezone.now() - timedelta(days=7)
        end_date = timezone.now()
        
        result = sync_woocommerce_config(
            config.id, 
            'test_sync', 
            start_date.isoformat(), 
            end_date.isoformat()
        )
        
        if result.get('success'):
            print(f"✅ Sync successful: {result}")
        else:
            print(f"❌ Sync failed: {result}")
            
    except Exception as e:
        print(f"❌ Sync error: {str(e)}")
EOF
}

# Check Celery worker status
check_celery_workers() {
    print_header "Checking Celery Workers"
    
    print_info "Checking Celery worker status..."
    docker-compose exec -T worker celery -A api inspect active
    docker-compose exec -T worker celery -A api inspect stats
    
    print_info "Checking Celery beat scheduler..."
    docker-compose exec -T beat celery -A api inspect scheduled
}

# Fix common issues
fix_common_issues() {
    print_header "Fixing Common Issues"
    
    print_info "Restarting Celery workers..."
    docker-compose restart worker beat
    
    print_info "Clearing any stuck tasks..."
    docker-compose exec -T worker celery -A api purge
    
    print_info "Checking for database migrations..."
    docker-compose exec -T backend python manage.py migrate --noinput
    
    print_info "Collecting static files..."
    docker-compose exec -T backend python manage.py collectstatic --noinput
}

# Run comprehensive pipeline test
run_pipeline_test() {
    print_header "Running Comprehensive Pipeline Test"
    
    print_info "Running the pipeline test script..."
    docker-compose exec -T backend python scripts/test_woocommerce_pipeline.py
}

# Main diagnostic function
main() {
    print_header "🔍 WooCommerce Pipeline Diagnostic & Fix"
    print_info "Starting comprehensive diagnosis at $(date)"
    
    # Run all checks
    check_environment
    check_containers
    check_woocommerce_configs
    check_pipeline_logs
    check_database
    test_woocommerce_apis
    check_celery_workers
    
    # Try to fix common issues
    fix_common_issues
    
    # Test the pipeline
    test_manual_sync
    run_pipeline_test
    
    print_header "🎉 Diagnostic Complete"
    print_info "Diagnostic completed at $(date)"
    print_info "Check the output above for any issues that need attention."
}

# Handle script arguments
case "${1:-}" in
    --test-only)
        test_woocommerce_apis
        test_manual_sync
        ;;
    --fix-only)
        fix_common_issues
        ;;
    --logs-only)
        check_pipeline_logs
        ;;
    *)
        main
        ;;
esac

