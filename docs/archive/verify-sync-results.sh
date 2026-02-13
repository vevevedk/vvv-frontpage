#!/bin/bash

#############################################
# WooCommerce Sync Results Verification
# Check sync success and data quality
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🔍 WooCommerce Sync Results Verification"
echo "========================================"

# Check recent sync jobs
print_info "Checking recent sync jobs..."
docker-compose exec -T backend python manage.py shell << 'EOF'
from woocommerce.models import WooCommerceJob, WooCommerceSyncLog
from django.utils import timezone
from datetime import timedelta

# Get recent jobs (last 24 hours)
recent_jobs = WooCommerceJob.objects.filter(
    created_at__gte=timezone.now() - timedelta(hours=24)
).order_by('-created_at')

print(f"Recent jobs (last 24 hours): {recent_jobs.count()}")
for job in recent_jobs:
    print(f"  {job.created_at}: {job.job_type} - {job.status}")
    if job.orders_processed:
        print(f"    Orders processed: {job.orders_processed}")
        print(f"    Orders created: {job.orders_created}")
        print(f"    Orders updated: {job.orders_updated}")
    if job.error_message:
        print(f"    Error: {job.error_message}")

# Get recent logs
recent_logs = WooCommerceSyncLog.objects.filter(
    created_at__gte=timezone.now() - timedelta(hours=24)
).order_by('-created_at')

print(f"\nRecent logs (last 24 hours): {recent_logs.count()}")
error_logs = recent_logs.filter(level='ERROR')
if error_logs.exists():
    print(f"  Error logs: {error_logs.count()}")
    for log in error_logs[:3]:
        print(f"    {log.created_at}: {log.message[:100]}")
else:
    print("  No error logs found")

success_logs = recent_logs.filter(level='INFO', message__icontains='completed')
if success_logs.exists():
    print(f"  Success logs: {success_logs.count()}")
    for log in success_logs[:3]:
        print(f"    {log.created_at}: {log.message[:100]}")
EOF

# Check data counts and freshness
print_info "Checking data counts and freshness..."
docker-compose exec -T backend python manage.py shell << 'EOF'
from woocommerce.models import WooCommerceOrder, WooCommerceOrderItem
from django.utils import timezone
from datetime import timedelta

# Total counts
total_orders = WooCommerceOrder.objects.count()
total_items = WooCommerceOrderItem.objects.count()

print(f"Total orders in database: {total_orders}")
print(f"Total order items in database: {total_items}")

if total_orders > 0:
    # Latest order
    latest_order = WooCommerceOrder.objects.order_by('-date_created').first()
    latest_sync = WooCommerceOrder.objects.order_by('-created_at').first()
    
    print(f"Latest order date: {latest_order.date_created}")
    print(f"Latest sync time: {latest_sync.created_at}")
    
    # Data freshness
    now = timezone.now()
    order_age = now - latest_order.date_created
    sync_age = now - latest_sync.created_at
    
    print(f"Order age: {order_age.days} days, {order_age.seconds // 3600} hours")
    print(f"Sync age: {sync_age.days} days, {sync_age.seconds // 3600} hours")
    
    # Orders by client
    from django.db.models import Count
    orders_by_client = WooCommerceOrder.objects.values('client_name').annotate(count=Count('id'))
    print(f"\nOrders by client:")
    for client in orders_by_client:
        print(f"  {client['client_name']}: {client['count']} orders")
    
    # Recent orders (last 7 days)
    recent_orders = WooCommerceOrder.objects.filter(
        date_created__gte=timezone.now() - timedelta(days=7)
    ).count()
    print(f"Orders in last 7 days: {recent_orders}")
    
    # Revenue summary
    from django.db.models import Sum
    total_revenue = WooCommerceOrder.objects.aggregate(Sum('order_total'))['order_total__sum'] or 0
    print(f"Total revenue: ${total_revenue:,.2f}")
    
    recent_revenue = WooCommerceOrder.objects.filter(
        date_created__gte=timezone.now() - timedelta(days=7)
    ).aggregate(Sum('order_total'))['order_total__sum'] or 0
    print(f"Revenue in last 7 days: ${recent_revenue:,.2f}")
else:
    print("No orders found in database")
EOF

# Check pipeline health
print_info "Checking pipeline health..."
docker-compose exec -T backend python manage.py shell << 'EOF'
from users.models import AccountConfiguration
from woocommerce.tasks import test_woocommerce_connection

# Check configurations
configs = AccountConfiguration.objects.filter(config_type='woocommerce', is_active=True)
print(f"Active WooCommerce configurations: {configs.count()}")

for config in configs:
    print(f"\n--- {config.account.name} ---")
    woocommerce_config = config.get_woocommerce_config()
    if woocommerce_config:
        success, message = test_woocommerce_connection(woocommerce_config)
        print(f"Connection: {'✅' if success else '❌'} {message}")
    else:
        print("❌ No configuration found")
EOF

# Check Celery worker status
print_info "Checking Celery worker status..."
docker-compose exec -T worker celery -A api inspect active | head -10
docker-compose exec -T worker celery -A api inspect stats | head -10

print_success "Sync verification completed!"
print_info "If you see any issues above, run './fix-woocommerce-pipeline.sh' for detailed diagnostics."

